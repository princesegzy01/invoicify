import express from "express";

const router = express.Router();

/* GET home page. */
router.get("/", (req: express.Request , res: express.Response, next) => {
        res.render("index", { title: "Invoicify", errorData : { message : ""} });
});

module.exports = router;
