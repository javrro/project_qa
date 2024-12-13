const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");
const { initTestDb, closeTestDb } = require("../setup/testDb");
const categoryRouter = require("../../routes/categories");
const Category = require("../../models/category");
// const {etag} = require("express/lib/utils");

const app = express();
app.use(bodyParser.json());
app.use("/api/categories", categoryRouter);

describe("Category Routes", () => {
  beforeAll(async () => {
    await initTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await Category.destroy({ where: {} });
  });

  describe("POST /api/categories", () => {
    it("should create a new category", async () => {
      const categoryData = {
        name: "Electronics",
      };

      const response = await request(app)
        .post("/api/categories")
        .send(categoryData)
        .expect(201);

      expect(response.body).toHaveProperty("name", categoryData.name);
      expect(response.body).toHaveProperty("id");
    });
  });

  describe("GET /api/categories", () => {
    let categories;

    beforeEach(async () => {
      categories = [
        { name: "Electronics" },
        { name: "Books" },
        { name: "Clothing" },
      ];

      await Category.bulkCreate(categories);
    });

    it("should return all categories", async () => {
      const response = await request(app).get("/api/categories").expect(200);

      // TODO add better assert
      expect(response.body.length).toEqual(categories.length);
    });
  });
});
