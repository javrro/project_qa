const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const { initTestDb, closeTestDb } = require("../setup/testDb");
const cartRouter = require("../../routes/cart");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const Category = require("../../models/category");

const app = express();
app.use(bodyParser.json());
app.use("/api/carts", cartRouter);

describe("Cart Routes", () => {
  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await Cart.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
  });

  describe("POST /api/carts/:userId", () => {
    it("should create a new cart", async () => {
      const userId = "10";
      const response = await request(app)
        .post("/api/carts/" + userId)
        .expect(201);

      expect(response.body).toHaveProperty("userId", userId);
    });
  });

  describe("POST /api/carts/:cartId/items", () => {
    const userId = "1";
    let cart, product;

    beforeEach(async () => {
      const category = await Category.create({ name: "Test Category" });
      product = await Product.create({
        name: "Test Product",
        price: 100,
        inventory: 10,
        categoryId: category.id,
      });
      cart = await Cart.create({ userId: userId });
    });

    it("should add item to cart", async () => {
      const quantity = 10;

      const response = await request(app)
        .post("/api/carts/" + cart.id + "/items")
        .send({
          productId: product.id,
          quantity: quantity,
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("cartId", cart.id.toString());
      expect(response.body).toHaveProperty("productId", product.id);
      expect(response.body).toHaveProperty("quantity", quantity);
      expect(response.body).toHaveProperty("updatedAt");
      expect(response.body).toHaveProperty("createdAt");
    });
  });

  describe("GET /api/carts/:cartId/items", () => {
    it("should return cart items with totals", async () => {});
  });
});
