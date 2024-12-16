// Mock the models before requiring the service
jest.mock('../../models/product', () => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    belongsTo: jest.fn()  // Mock the association method
}));

jest.mock('../../models/category', () => ({
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
}));

// Now require the service after the mocks are set up
const ProductService = require('../../services/productService');
const Product = require('../../models/product');
const Category = require('../../models/category');
const { Op } = require('sequelize');


describe('ProductService', () => {
    // Clear all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllProducts', () => {
        it('should return all products', async () => {
            const products = [{ id: 1 }, { id: 2 }];
            Product.findAll.mockResolvedValue(products);

            const result = await ProductService.getAllProducts();

            expect(Product.findAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(products);
        });
    });

    describe('getProductById', () => {
        it('should return a product when it exists', async () => {
            const product = { id: 1 };
            Product.findByPk.mockResolvedValue(product);

            const result = await ProductService.getProductById(1);

            expect(Product.findByPk).toHaveBeenCalledWith(1);
            expect(result).toEqual(product);
        });

        it('should return null when the product does not exist', async () => {
            Product.findByPk.mockResolvedValue(null);

            const result = await ProductService.getProductById(999);

            expect(Product.findByPk).toHaveBeenCalledWith(999);
            expect(result).toBeNull();
        });
    });

    describe('createProduct', () => {
        it('should create a product when category exists', async () => {
            const product = { name: 'Product 1', categoryId: 1 };
            const category = { id: 1 };

            Category.findByPk.mockResolvedValue(category);
            Product.create.mockResolvedValue(product);

            const result = await ProductService.createProduct(product);

            expect(Category.findByPk).toHaveBeenCalledWith(1);
            expect(Product.create).toHaveBeenCalledWith(product);
            expect(result).toEqual(product);
        });

        it('should throw an error when category does not exist', async () => {
            const product = { name: 'Product 1', categoryId: 999 };

            Category.findByPk.mockResolvedValue(null);

            await expect(ProductService.createProduct(product))
                .rejects
                .toThrow('Category with id 999 does not exist');

            expect(Category.findByPk).toHaveBeenCalledWith(999);
            expect(Product.create).not.toHaveBeenCalled();
        });
    });

    describe('updateProduct', () => {
        it('should update a product when category exists', async () => {
            const product = { name: 'Updated Product', categoryId: 1 };
            const category = { id: 1 };

            Category.findByPk.mockResolvedValue(category);
            Product.update.mockResolvedValue([1]);

            const result = await ProductService.updateProduct(1, product);

            expect(Category.findByPk).toHaveBeenCalledWith(1);
            expect(Product.update).toHaveBeenCalledWith(product, { where: { id: 1 } });
            expect(result).toEqual([1]);
        });

        it('should throw an error when new category does not exist', async () => {
            const product = { categoryId: 999 };

            Category.findByPk.mockResolvedValue(null);

            await expect(ProductService.updateProduct(1, product))
                .rejects
                .toThrow('Category with id 999 does not exist');

            expect(Category.findByPk).toHaveBeenCalledWith(999);
            expect(Product.update).not.toHaveBeenCalled();
        });

        it('should update a product without updating categoryId', async () => {
            const product = { name: 'Updated Product' }; // No categoryId
            Product.update.mockResolvedValue([1]);

            const result = await ProductService.updateProduct(1, product);

            expect(Product.update).toHaveBeenCalledWith(product, { where: { id: 1 } });
            expect(result).toEqual([1]);
        });

    });

    describe('deleteProduct', () => {
        it('should delete a product', async () => {
            Product.destroy.mockResolvedValue(1);

            const result = await ProductService.deleteProduct(1);

            expect(Product.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result).toEqual(1);
        });

        it('should return 0 when the product does not exist', async () => {
            Product.destroy.mockResolvedValue(0);

            const result = await ProductService.deleteProduct(999);

            expect(Product.destroy).toHaveBeenCalledWith({ where: { id: 999 } });
            expect(result).toEqual(0);
        });
    });

    describe('getProductsByCategory', () => {
        it('should return products by category', async () => {
            const products = [{ id: 1, categoryId: 1 }];
            Product.findAll.mockResolvedValue(products);

            const result = await ProductService.getProductsByCategory(1);

            expect(Product.findAll).toHaveBeenCalledWith({
                where: { categoryId: 1 },
                include: Category,
            });
            expect(result).toEqual(products);
        });

        it('should handle sorting and pagination', async () => {
            const products = [{ id: 1, categoryId: 1 }];
            Product.findAll.mockResolvedValue(products);

            const options = { sort: 'price,ASC', limit: 10, offset: 5 };

            const result = await ProductService.getProductsByCategory(1, options);

            expect(Product.findAll).toHaveBeenCalledWith({
                where: { categoryId: 1 },
                include: Category,
                order: [['price', 'ASC']],
                limit: 10,
                offset: 5,
            });
            expect(result).toEqual(products);
        });
    });

    describe('getProductsByCategories', () => {
        it('should return products by multiple categories', async () => {
            const products = [{ id: 1, categoryId: 1 }, { id: 2, categoryId: 2 }];
            Product.findAll.mockResolvedValue(products);

            const result = await ProductService.getProductsByCategories('1,2');

            expect(Product.findAll).toHaveBeenCalledWith({
                where: { categoryId: { [Op.in]: [1, 2] } },
                include: Category,
            });
            expect(result).toEqual(products);
        });

        it('should throw an error when categories parameter is empty', async () => {
            await expect(ProductService.getProductsByCategories(''))
                .rejects
                .toThrow('Categories parameter is required');

            expect(Product.findAll).not.toHaveBeenCalled();
        });

        it('should handle sorting and pagination for multiple categories', async () => {

            const products = [{ id: 1, categoryId: 1 }, { id: 2, categoryId: 2 }];
            Product.findAll.mockResolvedValue(products);

            const options = { sort: 'name,DESC', limit: 5 }; // Removed offset

            const result = await ProductService.getProductsByCategories('1,2', options);

            expect(Product.findAll).toHaveBeenCalledWith({
                where: { categoryId: { [Op.in]: [1, 2] } },
                include: Category,
                order: [['name', 'DESC']],
                limit: 5
            });
            expect(result).toEqual(products);

        });

        it('should handle offset for pagination in getProductsByCategories', async () => {
            const products = [{ id: 1, categoryId: 1 }, { id: 2, categoryId: 2 }];
            Product.findAll.mockResolvedValue(products);

            const options = { offset: 10 }; // Test with offset

            const result = await ProductService.getProductsByCategories('1,2', options);

            expect(Product.findAll).toHaveBeenCalledWith({
                where: { categoryId: { [Op.in]: [1, 2] } },
                include: Category,
                offset: 10 // Verify offset is applied
            });
            expect(result).toEqual(products);
        });

    });

});