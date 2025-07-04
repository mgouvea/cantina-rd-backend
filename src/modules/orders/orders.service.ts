import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { DashDate } from 'src/shared/types/dashDate.type';
import { GroupFamilyService } from '../group-family/group-family.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './entities/order.entity';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly whatsappService: WhatsappService,
    private readonly userService: UsersService,
    private readonly groupFamilyService: GroupFamilyService,
    private readonly productsService: ProductsService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const createdAt = new Date();

    // 1. Cria o pedido
    const order = await this.orderModel.create({
      ...createOrderDto,
      createdAt,
    });

    // 2. Busca informações completas do comprador
    const user = await this.userService.findOne(createOrderDto.buyerId);
    const buyerName = user.name;
    const buyerPhone = user.telephone;
    const orderTime = createdAt;
    const isChild = user.isChild;

    try {
      if (isChild) {
        if (user.groupFamily) {
          const groupFamily = await this.groupFamilyService.findOne(
            user.groupFamily.toString(),
          );
          if (groupFamily && groupFamily.owner) {
            const owner = await this.userService.findOne(groupFamily.owner);
            if (owner && owner.telephone) {
              await this.whatsappService.sendPurchaseConfirmation(
                buyerName,
                owner.telephone,
                orderTime,
                createOrderDto.products,
              );
            }
          }
        }
      } else if (buyerPhone) {
        await this.whatsappService.sendPurchaseConfirmation(
          buyerName,
          buyerPhone,
          orderTime,
          createOrderDto.products,
        );
      }
    } catch (error) {
      console.error(
        'Erro ao enviar mensagem de confirmação de compra:',
        error.message,
      );
    }

    return order;
  }

  /**
   * Cria múltiplas ordens de compra a partir de um array de CreateOrderDto
   * @param createOrderDtoArray Array de objetos CreateOrderDto
   * @returns Array com as ordens criadas
   */
  async createMany(createOrderDtoArray: CreateOrderDto[]) {
    if (
      !Array.isArray(createOrderDtoArray) ||
      createOrderDtoArray.length === 0
    ) {
      throw new BadRequestException(
        'É necessário fornecer um array com pelo menos uma ordem',
      );
    }

    // Processa cada ordem do array chamando o método create para cada uma
    const createdOrders = await Promise.all(
      createOrderDtoArray.map((orderDto) => this.create(orderDto)),
    );

    return createdOrders;
  }

  async findAll() {
    const orders = await this.orderModel.find();

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        let userName = '';

        // Buscar o nome do comprador apenas se buyerId for válido
        if (order.buyerId && order.buyerId.trim() !== '') {
          try {
            const user = await this.userService.findUserNameAndPhoneById(
              order.buyerId,
            );
            userName = user?.name || '';
          } catch (error) {
            console.error(
              `Erro ao buscar usuário com ID ${order.buyerId}:`,
              error.message,
            );
          }
        }

        // Buscar o nome do grupo familiar apenas se groupFamilyId for válido
        let groupFamilyName = '';
        if (order.groupFamilyId && order.groupFamilyId.trim() !== '') {
          try {
            groupFamilyName =
              (await this.groupFamilyService.findGroupFamilyName(
                order.groupFamilyId,
              )) || '';
          } catch (error) {
            console.error(
              `Erro ao buscar grupo familiar com ID ${order.groupFamilyId}:`,
              error.message,
            );
          }
        }

        return {
          ...order.toObject(),
          buyerName: userName,
          groupFamilyName: groupFamilyName,
        };
      }),
    );

    return ordersWithDetails;
  }

  findOne(id: string) {
    return this.orderModel.findById(id);
  }

  async findTotalOrders(dateRange: DashDate) {
    // Validar se as datas são válidas
    if (
      !dateRange ||
      !dateRange.startDate ||
      !dateRange.endDate ||
      isNaN(dateRange.startDate.getTime()) ||
      isNaN(dateRange.endDate.getTime())
    ) {
      return 0; // Retorna 0 se as datas forem inválidas
    }

    const orders = await this.orderModel
      .find({
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      })
      .exec();

    return orders.reduce((total, order) => total + order.totalPrice, 0);
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return this.orderModel.findByIdAndUpdate(id, updateOrderDto);
  }

  async remove(id: string) {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    if (order.invoiceId) {
      throw new BadRequestException(
        'Este pedido não pode ser excluído pois está associado a uma fatura',
      );
    }

    return this.orderModel.findByIdAndDelete(id);
  }

  /**
   * Encontra os produtos mais vendidos dentro de um intervalo de datas
   * @param dateRange Objeto contendo startDate e endDate
   * @returns Lista de produtos com quantidade vendida, ordenada do mais vendido para o menos vendido
   */
  async findMostSoldProducts(dateRange: DashDate) {
    // Validar se as datas são válidas
    if (
      !dateRange ||
      !dateRange.startDate ||
      !dateRange.endDate ||
      isNaN(dateRange.startDate.getTime()) ||
      isNaN(dateRange.endDate.getTime())
    ) {
      throw new BadRequestException(
        'Datas de início e fim são obrigatórias e devem ser válidas',
      );
    }

    // Buscar todas as ordens no período especificado
    const orders = await this.orderModel
      .find({
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      })
      .exec();

    // Mapa para armazenar a contagem de produtos
    // Chave: ID do produto
    // Valor: { id, name, price, totalQuantity, urlImage }
    const productMap = new Map<
      string,
      {
        id: string;
        name: string;
        price: number;
        totalQuantity: number;
        urlImage?: string;
      }
    >();

    // Processar cada ordem e seus produtos
    for (const order of orders) {
      // Verificar se a ordem tem produtos
      if (!order.products || !Array.isArray(order.products)) {
        console.warn(
          'Ordem sem produtos ou produtos não é um array:',
          order._id,
        );
        continue;
      }

      // Processar cada produto na ordem
      for (const product of order.products) {
        // Verificar se o produto tem as propriedades necessárias
        if (!product || typeof product !== 'object') {
          console.warn('Produto inválido encontrado:', product);
          continue;
        }

        // Extrair dados do produto, lidando com diferentes formatos
        const productId = product.id;
        const name = product.name;
        const price = product.price;
        const quantity = product.quantity || 1; // Default para 1 se não especificado

        if (!productId || !name) {
          console.warn('Produto sem ID ou nome encontrado:', product);
          continue;
        }

        // Atualizar o mapa de produtos
        if (productMap.has(productId)) {
          const existingProduct = productMap.get(productId);
          existingProduct.totalQuantity += quantity;
        } else {
          productMap.set(productId, {
            id: productId,
            name,
            price,
            totalQuantity: quantity,
          });
        }
      }
    }

    // Converter o mapa para array e ordenar por quantidade (do maior para o menor)
    const sortedProducts = Array.from(productMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity,
    );

    // Buscar as URLs das imagens dos produtos
    const productsWithImages = await Promise.all(
      sortedProducts.map(async (product) => {
        try {
          // Buscar o produto completo do banco de dados para obter a URL da imagem
          const productDetails = await this.productsService.findOne(product.id);
          // Adicionar a URL da imagem ao objeto do produto
          return {
            ...product,
            urlImage: productDetails?.urlImage || null,
          };
        } catch (error) {
          console.warn(
            `Erro ao buscar detalhes do produto ${product.id}:`,
            error.message,
          );
          // Retornar o produto sem a URL da imagem em caso de erro
          return product;
        }
      }),
    );

    return productsWithImages;
  }

  /**
   * Encontra os clientes que mais compraram dentro de um intervalo de datas
   * @param dateRange Objeto contendo startDate e endDate
   * @returns Lista de clientes com valor total de compras, ordenada do maior para o menor valor
   */
  async findTopBuyers(dateRange: DashDate) {
    // Validar se as datas são válidas
    if (
      !dateRange ||
      !dateRange.startDate ||
      !dateRange.endDate ||
      isNaN(dateRange.startDate.getTime()) ||
      isNaN(dateRange.endDate.getTime())
    ) {
      throw new BadRequestException(
        'Datas de início e fim são obrigatórias e devem ser válidas',
      );
    }

    // Buscar todas as ordens no período especificado
    const orders = await this.orderModel
      .find({
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      })
      .exec();

    // Mapa para armazenar o total de compras por cliente
    // Chave: ID do cliente (buyerId)
    // Valor: { id, totalSpent, ordersCount }
    const buyerMap = new Map<
      string,
      {
        id: string;
        totalSpent: number;
        ordersCount: number;
      }
    >();

    // Processar cada ordem
    for (const order of orders) {
      const buyerId = order.buyerId;
      const totalPrice = order.totalPrice || 0;

      if (!buyerId) {
        console.warn('Ordem sem buyerId encontrada:', order._id);
        continue;
      }

      // Atualizar o mapa de compradores
      if (buyerMap.has(buyerId)) {
        const existingBuyer = buyerMap.get(buyerId);
        existingBuyer.totalSpent += totalPrice;
        existingBuyer.ordersCount += 1;
      } else {
        buyerMap.set(buyerId, {
          id: buyerId,
          totalSpent: totalPrice,
          ordersCount: 1,
        });
      }
    }

    // Converter o mapa para array e ordenar por valor total gasto (do maior para o menor)
    const sortedBuyers = Array.from(buyerMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent,
    );

    // Buscar informações detalhadas dos clientes
    const buyersWithDetails = await Promise.all(
      sortedBuyers.map(async (buyer) => {
        try {
          // Buscar o cliente completo do banco de dados
          const userDetails = await this.userService.findOne(buyer.id);

          // Usar o nome do grupo familiar já populado
          const groupFamilyName: string = userDetails?.groupFamily
            ? (userDetails.groupFamily as unknown as { name: string }).name ||
              ''
            : '';
          // const groupFamilyName = '';

          // Adicionar os detalhes do cliente ao objeto
          return {
            id: buyer.id,
            name: userDetails?.name || 'Cliente não encontrado',
            totalSpent: buyer.totalSpent,
            ordersCount: buyer.ordersCount,
            averageOrderValue: buyer.totalSpent / buyer.ordersCount,
            groupFamilyId: userDetails?.groupFamily || null,
            groupFamilyName,
            urlImage: userDetails?.urlImage || null,
          };
        } catch (error) {
          // Retornar o cliente com informações básicas em caso de erro
          return {
            id: buyer.id,
            name: 'Cliente não encontrado',
            totalSpent: buyer.totalSpent,
            ordersCount: buyer.ordersCount,
            averageOrderValue: buyer.totalSpent / buyer.ordersCount,
            groupFamilyId: null,
            groupFamilyName: '',
            urlImage: null,
          };
        }
      }),
    );

    return buyersWithDetails;
  }
}
