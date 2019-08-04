import express from "express";
import moment from "moment";
var slugify = require('slugify')


import _ from "lodash";

const http = require('http');
const fs = require('fs');

const multer = require('multer');
const csv = require('fast-csv');

const upload = multer({ dest: 'tmp/csv/' });

const router = express.Router();

/* GET home page. */
router.post("/", upload.single('csvdata'), (req: express.Request , res: express.Response, next) => {

        // container to handle all processed bill
        const fileRows: Array<any> = [];

        let x = 0;
        csv.parseFile(req.file.path).on("data", function (data: Array<string>) {

                let data_line:Array<any> = data;
        
                if (x == 0 ) {

                        // add extra colum headers to the headings
                        data_line.push("cost");
                        data_line.push("num hrs");
                }else{

                        let full_start_date = data_line[3] + " " +  data_line[4];
                        let full_end_date = data_line[3] + " " +  data_line[5];
        
                        // get hour differences between the start time and end time.
                        const num_hours = getHourDifference(full_start_date, full_end_date);

                        // get the lawyer billbable rate per hour
                        let billableRate: number = parseFloat(data_line[1]);

                        // get the total cost by multiplying 
                        // billable hour by the hours spent
                        let totalBill: number = billableRate * num_hours;

                        // push the 2 new colum to the bill array
                        data_line.push(totalBill);
                        data_line.push(num_hours);
                }
                
                // push each processed bill to a new array
                fileRows.push(data_line)

                x += 1; 

       
        }).on("end", function () {
                
                // delete the heading from the csv array
                fileRows.shift()
                let data_body = fileRows;

                // create a bill array
                let bill_array: Array<Object> = [];

                // loop through all bills and create a bill objects from it
                data_body.forEach(element => { 

                        const bill_obj = {
                                'employee' : element[0],
                                'hour_rate' : element[1],
                                'project' : element[2],
                                'cost' : element[6],
                                'num_hrs' : element[7]
                        }

                        bill_array.push(bill_obj)
                });


                // group all similar bills based on the projects 
                let group_data = _.groupBy(bill_array, function(b) { return b.project})

                // get all the project keys
                const company_keys = Object.keys(group_data);

                // create each company container
                let company_data:Array<Array<Object>> = []

                // loop through each keys ans store each company bills in an array of aray
                company_keys.forEach(key => {
                        company_data.push(group_data[key]);
                });

                // remove temp file
                fs.unlinkSync(req.file.path);   

                //send data along with the invoice
                res.render("invoice", { data: company_data })
        })
});

function getHourDifference(start: string, end: string){

        let m_start = moment(start);
        let m_end = moment(end);

        let num_hours = m_end.diff(m_start, "hours")
        
        return num_hours;
}


module.exports = router;
