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
    it("should return error when name is null", async () => {
      const response = await request(app)
          .post("/api/products")
          .send({
            name: null,
            price: 100,
            description: "Test Description",
            inventory: 10,
            taxRate: 0.4,
            categoryId: category.id,
          })
          .expect(400);

      expect(response.body.error).toEqual(
          "notNull Violation: Product.name cannot be null"
      );
    });
    it("should return error when price is null", async () => {

      const response = await request(app)
          .post("/api/products")
          .send({
            name: "Test Name",
            price: null,
            description: "Test Description",
            inventory: 10,
            taxRate: 0.4,
            categoryId: category.id,
          })
          .expect(400);

      expect(response.body.error).toEqual(
          "notNull Violation: Product.price cannot be null"
      );
    });
    it("should return error when inventory is null", async () => {

      const response = await request(app)
          .post("/api/products")
          .send({
            name: "Test Name",
            price: 10,
            description: "Test Description",
            inventory: null,
            taxRate: 0.4,
            categoryId: category.id,
          })
          .expect(400);

      expect(response.body.error).toEqual(
          "notNull Violation: Product.inventory cannot be null"
      );
    });
    it("should return error when inventory is below 0", async () => {

      const response = await request(app)
          .post("/api/products")
          .send({
            name: "Test Name",
            price: 1,
            description: "Test Description",
            inventory: -1,
            taxRate: 0.4,
            categoryId: category.id,
          })
          .expect(400);

      expect(response.body.error).toEqual(
          "Validation error: Validation min on inventory failed"
      );
    });
    it("should return error when tax rate is above 1", async () => {

      const response = await request(app)
          .post("/api/products")
          .send({
            name: "Test Name",
            price: 100,
            description: null,
            inventory: "A",
            taxRate: 1.1,
            categoryId: category.id,
          })
          .expect(400);

      expect(response.body.error).toEqual(
          "Validation error: Validation max on taxRate failed"
      );
    });
    it("should return error when tax rate is below 1", async () => {

      const response = await request(app)
          .post("/api/products")
          .send({
            name: "Test Name",
            price: 100,
            description: null,
            inventory: "A",
            taxRate: -0.5,
            categoryId: category.id,
          })
          .expect(400);

      expect(response.body.error).toEqual(
          "Validation error: Validation min on taxRate failed"
      );
    });
  });

  describe("GET /api/products/category/:categoryId", () => {
    it("should return products for category", async () => {
      const category1 = await Category.create({ name: "Test Category #1" });
      const category2 = await Category.create({ name: "Test Category #2" });

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
  });
});
