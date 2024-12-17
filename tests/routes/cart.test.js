const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const { initTestDb, closeTestDb } = require("../setup/testDb");
const cartRouter = require("../../routes/cart");
const Cart = require("../../models/cart");
const Product = require("../../models/product");
const Category = require("../../models/category");
const CartItem = require("../../models/cartItem");

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

  describe("POST /api/carts/:userId", () => {
    it("should return 400 error", async () => {
      const userId = null;
      const response = await request(app)
        .post("/api/carts/" + userId)
        .expect(400);

      expect(response.body).toHaveProperty("error", "userId must be a valid Integer");
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

  //test unhappy path add item to cart when inventory too low
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

    it("should return error if quantity ti high", async () => {
      const quantity = 100;

      const response = await request(app)
        .post("/api/carts/" + cart.id + "/items")
        .send({
          productId: product.id,
          quantity: quantity,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Not enough inventory available");
    });
  });

  //test unhappy path add item to cart when item doesnt exist
  describe("POST /api/carts/:cartId/items", () => {
    const userId = "1";
    let cart;

    beforeEach(async () => {
      cart = await Cart.create({ userId: userId });
    });

    it("should return error if quantity to high", async () => {
      const quantity = 100;

      const response = await request(app)
        .post("/api/carts/" + cart.id + "/items")
        .send({
          productId: "123",
          quantity: quantity,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error", "Product not found");
    });
  });

  //happy path get cart items
  describe("GET /api/carts/:cartId/items", () => {
    const userId = "1";
    let cart;

    beforeEach(async () => {
      const category = await Category.create({ name: "Test Category" });
      const product = await Product.create({
        name: "Test Product",
        price: 100,
        inventory: 10,
        categoryId: category.id,
      });
      cart = await Cart.create({ userId: userId });
      await CartItem.create({cartId: cart.id, productId: product.id, quantity: 5})
    });

    it("should return cart items with totals", async () => {
      const response = await request(app)
        .get("/api/carts/" + cart.id + "/items")
        .expect(200);

        expect(response.body).toHaveProperty("items");
        expect(response.body).toHaveProperty("summary");
        expect(response.body.items.length).toBe(1)
    });
  });

  //unhappy path get cart items
  describe("GET /api/carts/:cartId/items", () => {
    const userId = "1";
    let cart;

    beforeEach(async () => {
      const category = await Category.create({ name: "Test Category" });
      const product = await Product.create({
        name: "Test Product",
        price: 100,
        inventory: 10,
        categoryId: category.id,
      });
      cart = await Cart.create({ userId: userId });
      await CartItem.create({cartId: cart.id, productId: product.id, quantity: 5})
    });
    const badCartId = "xxx"
    it("should return cart items error", async () => {
      const response = await request(app)
        .get(`/api/carts/${badCartId}/items/`)
        .expect(400);

        expect(response.body).toHaveProperty("error");
    });
  });

  //happy path put cart items
  describe("PUT /api/carts/:cartId/items/:itemId", () => {
    const userId = "1";
    let cart;
    let cartItem;

    beforeEach(async () => {
      const category = await Category.create({ name: "Test Category" });
      const product = await Product.create({
        name: "Test Product",
        price: 100,
        inventory: 10,
        categoryId: category.id,
      });
      cart = await Cart.create({ userId: userId });
      cartItem = await CartItem.create({cartId: cart.id, productId: product.id, quantity: 5})
    });

    it("should return cart items modified", async () => {
      const response = await request(app)
        .put(`/api/carts/${cart.id}/items/${cartItem.id}`)
        .send({
          quantity: 1,
        })
        .expect(200);

        expect(response.body).toHaveProperty("quantity");
        expect(response.body.quantity).toBe(1)
    });
  });

  //unhappy path put cart items
  describe("PUT /api/carts/:cartId/items/:itemId", () => {
    const userId = "1";
    let cart;
    let cartItem;

    beforeEach(async () => {
      const category = await Category.create({ name: "Test Category" });
      const product = await Product.create({
        name: "Test Product",
        price: 100,
        inventory: 10,
        categoryId: category.id,
      });
      cart = await Cart.create({ userId: userId });
      cartItem = await CartItem.create({cartId: cart.id, productId: product.id, quantity: 5})
    });

    const badCartItemId = 100
    it("should return cart items error", async () => {
      const response = await request(app)
        .put(`/api/carts/${cart.id}/items/${badCartItemId}`)
        .send({
          quantity: 1,
        })
        .expect(400);

        expect(response.body).toHaveProperty("error");
    });
  });

  //happy path delete cart items
  describe("DELETE /api/carts/:cartId/items/:itemId", () => {
    const userId = "1";
    let cart;
    let cartItem;

    beforeEach(async () => {
      const category = await Category.create({ name: "Test Category" });
      const product = await Product.create({
        name: "Test Product",
        price: 100,
        inventory: 10,
        categoryId: category.id,
      });
      cart = await Cart.create({ userId: userId });
      cartItem = await CartItem.create({cartId: cart.id, productId: product.id, quantity: 5})
    });

    it("should return cart items is deleted", async () => {
      const response = await request(app)
        .delete(`/api/carts/${cart.id}/items/${cartItem.id}`)
        .expect(204);

    });
  });

   //unhappy path delete cart items
   describe("DELETE /api/carts/:cartId/items/:itemId", () => {
    const userId = "1";
    let cart;
    let cartItem;

    beforeEach(async () => {
      const category = await Category.create({ name: "Test Category" });
      const product = await Product.create({
        name: "Test Product",
        price: 100,
        inventory: 10,
        categoryId: category.id,
      });
      cart = await Cart.create({ userId: userId });
      cartItem = await CartItem.create({cartId: cart.id, productId: product.id, quantity: 5})
    });

    const badCartItemId = 100
    it("should return cart item not found", async () => {
      const response = await request(app)
        .delete(`/api/carts/${cart.id}/items/${badCartItemId}`)
        .expect(400);

        expect(response.body).toHaveProperty("error");

    });
  });

});
