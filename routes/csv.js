"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var moment_1 = __importDefault(require("moment"));
var slugify = require('slugify');
var lodash_1 = __importDefault(require("lodash"));
var http = require('http');
var fs = require('fs');
var multer = require('multer');
var csv = require('fast-csv');
var upload = multer({ dest: 'tmp/csv/' });
var router = express_1.default.Router();
/* GET home page. */
router.post("/", upload.single('csvdata'), function (req, res, next) {
    // container to handle all processed bill
    var fileRows = [];
    var x = 0;
    csv.parseFile(req.file.path).on("data", function (data) {
        var data_line = data;
        if (x == 0) {
            // add extra colum headers to the headings
            data_line.push("cost");
            data_line.push("num hrs");
        }
        else {
            var full_start_date = data_line[3] + " " + data_line[4];
            var full_end_date = data_line[3] + " " + data_line[5];
            // get hour differences between the start time and end time.
            var num_hours = getHourDifference(full_start_date, full_end_date);
            // get the lawyer billbable rate per hour
            var billableRate = parseFloat(data_line[1]);
            // get the total cost by multiplying 
            // billable hour by the hours spent
            var totalBill = billableRate * num_hours;
            // push the 2 new colum to the bill array
            data_line.push(totalBill);
            data_line.push(num_hours);
        }
        // push each processed bill to a new array
        fileRows.push(data_line);
        x += 1;
    }).on("end", function () {
        // delete the heading from the csv array
        fileRows.shift();
        var data_body = fileRows;
        // create a bill array
        var bill_array = [];
        // loop through all bills and create a bill objects from it
        data_body.forEach(function (element) {
            var bill_obj = {
                'employee': element[0],
                'hour_rate': element[1],
                'project': element[2],
                'cost': element[6],
                'num_hrs': element[7]
            };
            bill_array.push(bill_obj);
        });
        // group all similar bills based on the projects 
        var group_data = lodash_1.default.groupBy(bill_array, function (b) { return b.project; });
        // get all the project keys
        var company_keys = Object.keys(group_data);
        // create each company container
        var company_data = [];
        // loop through each keys ans store each company bills in an array of aray
        company_keys.forEach(function (key) {
            company_data.push(group_data[key]);
        });
        // remove temp file
        fs.unlinkSync(req.file.path);
        //send data along with the invoice
        res.render("invoice", { data: company_data });
    });
});
function getHourDifference(start, end) {
    var m_start = moment_1.default(start);
    var m_end = moment_1.default(end);
    var num_hours = m_end.diff(m_start, "hours");
    return num_hours;
}
module.exports = router;
