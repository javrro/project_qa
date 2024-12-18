const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const {initTestDb, closeTestDb} = require("../setup/testDb");
const productRouter = require("../../routes/products");
const Product = require("../../models/product");
const Category = require("../../models/category");
const ProductService = require('../../services/productService');
// const {response} = require("express");

const app = express();
app.use(bodyParser.json());
app.use("/api/products", productRouter);

describe("Product Routes", () => {
    beforeAll(async () => {
        await initTestDb();
    });

    afterAll(async () => {
        await closeTestDb();
    });

    beforeEach(async () => {
        jest.resetAllMocks();
        await Product.destroy({where: {}});
        await Category.destroy({where: {}});
    });

    describe("POST /api/products", () => {
        let category;

        beforeEach(async () => {
            category = await Category.create({name: "Test Category"});
        });

        it("should create a new product", async () => {
            let name = "Test Name";
            let price = 100;
            let description = "Test Description";
            let inventory = 10;
            let taxRate = 0.4;

            const response = await request(app)
                .post("/api/products")
                .send({
                    name: name,
                    price: price,
                    description: description,
                    inventory: inventory,
                    taxRate: taxRate,
                    categoryId: category.id,
                })
                .expect(201);

            expect(response.body).toHaveProperty("id");
            expect(response.body).toHaveProperty("name", name);
            expect(response.body).toHaveProperty("price", price);
            expect(response.body).toHaveProperty("description", description);
            expect(response.body).toHaveProperty("inventory", inventory);
            expect(response.body).toHaveProperty("taxRate", taxRate);
            expect(response.body).toHaveProperty("categoryId", category.id);
        });
        it('should return an error when exception is thrown', async () => {
            const testMessage = "Test Error";

            jest.spyOn(ProductService, 'createProduct')
                .mockImplementation(() => { throw new Error(testMessage) });

            let name = "Test Name";
            let price = 100;
            let description = "Test Description";
            let inventory = 10;
            let taxRate = 0.4;

            const response = await request(app)
                .post("/api/products/")
                .send({
                    name: name,
                    price: price,
                    description: description,
                    inventory: inventory,
                    taxRate: taxRate,
                    categoryId: category.id,
                })
                .expect(400);

            expect(response.body.error).toEqual(testMessage);
        });
    });

    describe("GET /api/products/", () => {
        it("should return all products", async () => {
            const productNameMock = "Mocked Product";

            jest.spyOn(ProductService, 'getAllProducts')
                .mockImplementation(() => [
                    {
                        name: productNameMock
                    }
                ]);

            const response = await request(app)
                .get("/api/products/")
                .expect(200);

            expect(response.body.length).toEqual(1);
            expect(response.body.find(o => o.name === productNameMock)).not.toBeNull();
        });
        it("should return error when exception is thrown", async () => {
            const testMessage = "Test Error";

            jest.spyOn(ProductService, 'getAllProducts')
                .mockImplementation(() => { throw new Error(testMessage) });

            const response = await request(app)
                .get("/api/products/")
                .expect(500);

            expect(response.body.error).toEqual(testMessage);
        });
    });

    describe("GET /api/products/category/:categoryId", () => {
        it("should return products for category", async () => {
            const category1 = await Category.create({name: "Test Category #1"});
            const category2 = await Category.create({name: "Test Category #2"});

            const productNameA = "Product A";
            const productNameB = "Product B";

            await Product.bulkCreate([
                {
                    name: productNameA,
                    description: "Product A",
                    price: 100,
                    inventory: 20,
                    taxRate: 0,
                    categoryId: category1.id,
                },
                {
                    name: productNameB,
                    description: "Product B",
                    price: 100,
                    inventory: 20,
                    taxRate: 0,
                    categoryId: category1.id,
                },
                {
                    name: "Product C",
                    description: "Product C",
                    price: 100,
                    inventory: 20,
                    taxRate: 0,
                    categoryId: category2.id,
                },
            ]);

            const response = await request(app)
                .get("/api/products/category/" + category1.id)
                .expect(200);

            expect(response.body.length).toEqual(2);
            expect(response.body.find(o => o.name === productNameA)).not.toBeNull();
            expect(response.body.find(o => o.name === productNameB)).not.toBeNull();
        });
        it("should return error when exception is thrown", async () => {
            const testMessage = "Test Error";

            jest.spyOn(ProductService, 'getProductsByCategory')
                .mockImplementation(() => { throw new Error(testMessage) });

            const response = await request(app)
                .get("/api/products/category/1")
                .expect(400);

            expect(response.body.error).toEqual(testMessage);
        });
    });

    describe("GET /api/products/categories/", () => {
        it("should return products for multiple categories", async () => {
            const productNameMock = "Mocked Product";

            jest.spyOn(ProductService, 'getProductsByCategories')
                .mockImplementation(() => [
                    {
                        name: productNameMock
                    }
                ]);

            const response = await request(app)
                .get("/api/products/categories/")
                .expect(200);

            expect(response.body.length).toEqual(1);
            expect(response.body.find(o => o.name === productNameMock)).not.toBeNull();
        });
        it("should return error when exception is thrown", async () => {
            const testMessage = "Test Error";

            jest.spyOn(ProductService, 'getProductsByCategories')
                .mockImplementation(() => { throw new Error(testMessage) });

            const response = await request(app)
                .get("/api/products/categories/")
                .expect(400);

            expect(response.body.error).toEqual(testMessage);
        });
    });
});
