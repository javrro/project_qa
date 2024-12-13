const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const { initTestDb, closeTestDb } = require("../setup/testDb");
const productRouter = require("../../routes/products");
const Product = require("../../models/product");
const Category = require("../../models/category");
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
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
  });

  describe("POST /api/products", () => {
    let category;

    beforeEach(async () => {
      category = await Category.create({ name: "Test Category" });
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

    it("should return error when category does not exist", async () => {
      let name = "Test Name";
      let price = 100;
      let description = "Test Description";
      let inventory = 10;
      let taxRate = 0.4;

      let categoryId = 999;

      const response = await request(app)
        .post("/api/products")
        .send({
          name: name,
          price: price,
          description: description,
          inventory: inventory,
          taxRate: taxRate,
          categoryId: categoryId,
        })
        .expect(400);

      expect(response.body.error).toEqual(
        "Category with id " + categoryId + " does not exist"
      );
    });
  });

  describe("GET /api/products/category/:categoryId", () => {
    it("should return products for category", async () => {
      const category1 = await Category.create({ name: "Test Category #1" });
      const category2 = await Category.create({ name: "Test Category #2" });

      await Product.bulkCreate([
        {
          name: "Product A",
          description: "Product A",
          price: 100,
          inventory: 20,
          taxRate: 0,
          categoryId: category1.id,
        },
        {
          name: "Product B",
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

      // TODO add better assert
      expect(response.body.length).toEqual(2);
    });
  });
});
