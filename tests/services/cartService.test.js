// Mock the models
jest.mock('../../models/cart', () => ({
  create: jest.fn(),
  findByPk: jest.fn()
}));

jest.mock('../../models/cartItem', () => ({
  findOne: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  findByPk: jest.fn()
}));

jest.mock('../../models/product', () => ({
  findByPk: jest.fn()
}));

const CartService = require('../../services/cartService');
const Cart = require('../../models/cart');
const CartItem = require('../../models/cartItem');
const Product = require('../../models/product');

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // PRUEBA CREAR CARRITO
  describe('createCart', () => {
    it('should create a new cart', async () => {
      // Mock del retorno de `Cart.create`
      const mockCart = { id: 1, userId: 123, createdAt: new Date() };
      Cart.create.mockResolvedValue(mockCart);

      const userId = 123;
      const result = await CartService.createCart(userId);

      expect(Cart.create).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockCart);
    });
  });

  // PRUEBA AÑADOR ITEM AL CARRITO
  describe('addItemToCart', () => {
    const mockProduct = { id: 1, inventory: 10, price: 100 };
    const mockCartItem = { cartId: 1, productId: 1, quantity: 2, save: jest.fn() };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should add a new item to the cart when product exists and has sufficient inventory', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);
      CartItem.findOne.mockResolvedValue(null); // No existe el ítem
      CartItem.create.mockResolvedValue(mockCartItem);

      const result = await CartService.addItemToCart(1, 1, 2);

      expect(Product.findByPk).toHaveBeenCalledWith(1);
      expect(CartItem.findOne).toHaveBeenCalledWith({ where: { cartId: 1, productId: 1 } });
      expect(CartItem.create).toHaveBeenCalledWith({ cartId: 1, productId: 1, quantity: 2 });
      expect(result).toEqual(mockCartItem);
    });

    it('should update the quantity of an existing item in the cart', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);
      const existingCartItem = { ...mockCartItem, quantity: 2, save: jest.fn() };
      CartItem.findOne.mockResolvedValue(existingCartItem);

      const result = await CartService.addItemToCart(1, 1, 3);

      expect(existingCartItem.quantity).toBe(5); // 2 + 3
      expect(existingCartItem.save).toHaveBeenCalled();
      expect(result).toEqual(existingCartItem);
    });

    it('should throw an error if the product does not exist', async () => {
      Product.findByPk.mockResolvedValue(null);

      await expect(CartService.addItemToCart(1, 1, 2)).rejects.toThrow('Product not found');
      expect(Product.findByPk).toHaveBeenCalledWith(1);
    });

    it('should throw an error if not enough inventory is available for a new item', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);
      CartItem.findOne.mockResolvedValue(null);

      await expect(CartService.addItemToCart(1, 1, 15)).rejects.toThrow('Not enough inventory available');
    });

    it('should throw an error if not enough inventory is available for an existing item', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);
      const existingCartItem = { ...mockCartItem, quantity: 8, save: jest.fn() };
      CartItem.findOne.mockResolvedValue(existingCartItem);

      await expect(CartService.addItemToCart(1, 1, 5)).rejects.toThrow('Not enough inventory available');
    });
  });

  // PRUEBA OBTENER ITEMS DEL CARRITO 
  describe('getCartItems', () => {
    const mockCartItem = {
      id: 1,
      cartId: 1,
      productId: 1,
      quantity: 2,
      Product: { price: 50, taxRate: 0.1 },
      toJSON: jest.fn().mockReturnValue({ id: 1, cartId: 1, productId: 1, quantity: 2 })
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return all cart items with correct calculations', async () => {
      CartItem.findAll.mockResolvedValue([mockCartItem]);

      const result = await CartService.getCartItems(1);

      expect(CartItem.findAll).toHaveBeenCalledWith({ where: { cartId: 1 }, include: Product });
      expect(result).toEqual({
        items: [
          {
            ...mockCartItem.toJSON(),
            itemSubtotal: 100,
            itemTax: 10
          }
        ],
        summary: {
          subtotal: 100,
          totalTax: 10,
          total: 110
        }
      });
    });

    it('should return an empty cart if there are no items', async () => {
      CartItem.findAll.mockResolvedValue([]);

      const result = await CartService.getCartItems(1);

      expect(CartItem.findAll).toHaveBeenCalledWith({ where: { cartId: 1 }, include: Product });
      expect(result).toEqual({
        items: [],
        summary: {
          subtotal: 0,
          totalTax: 0,
          total: 0
        }
      });
    });
  });

  // PRUEBA PARA ACTUALIZAR ITEM DEL CARRITO
  describe('updateCartItem', () => {
    const mockCartItem = {
      id: 1,
      cartId: 1,
      productId: 1,
      quantity: 2,
      Product: { inventory: 10 },
      save: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should update the quantity of an existing cart item', async () => {
      CartItem.findByPk.mockResolvedValue(mockCartItem);

      const result = await CartService.updateCartItem(1, 5);

      expect(CartItem.findByPk).toHaveBeenCalledWith(1, { include: Product });
      expect(mockCartItem.quantity).toBe(5);
      expect(mockCartItem.save).toHaveBeenCalled();
      expect(result).toEqual(mockCartItem);
    });

    it('should throw an error if the cart item is not found', async () => {
      CartItem.findByPk.mockResolvedValue(null);

      await expect(CartService.updateCartItem(1, 5)).rejects.toThrow('Item not found');
      expect(CartItem.findByPk).toHaveBeenCalledWith(1, { include: Product });
    });

    it('should throw an error if not enough inventory is available', async () => {
      CartItem.findByPk.mockResolvedValue({
        ...mockCartItem,
        Product: { inventory: 4 }
      });

      await expect(CartService.updateCartItem(1, 5)).rejects.toThrow('Not enough inventory available');
      expect(CartItem.findByPk).toHaveBeenCalledWith(1, { include: Product });
    });
  });

  // PRUEBA PARA REMOVER ITEM DEL CARRITO
  describe('removeCartItem', () => {
    const mockCartItem = {
      id: 1,
      destroy: jest.fn()
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should remove the cart item if it exists', async () => {
      CartItem.findByPk.mockResolvedValue(mockCartItem);

      await CartService.removeCartItem(1);

      expect(CartItem.findByPk).toHaveBeenCalledWith(1);
      expect(mockCartItem.destroy).toHaveBeenCalled();
    });

    it('should throw an error if the cart item is not found', async () => {
      CartItem.findByPk.mockResolvedValue(null);

      await expect(CartService.removeCartItem(1)).rejects.toThrow('Item not found');
      expect(CartItem.findByPk).toHaveBeenCalledWith(1);
    });
  });
});