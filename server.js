require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const PORT = process.env.PORT;

let cartStorageName = 'desibites_cart';
//console.log("Checking DB Host:", process.env.DB_HOST);
// Database Configuration
const dbConfig = { 
  host: process.env.DB_HOST, 
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
};

 const transporter = nodemailer.createTransport({
       service: 'gmail',
        auth: {
        user: 'elon4466@gmail.com',         // Replace with your actual Gmail
        pass: 'kqxuzxgnwcrynmth'             // Replace with your 16-digit Gmail App Password
        }
    });

// Create the database connection
const db = mysql.createConnection(dbConfig);

const server = http.createServer((req, res) => {

  // fecthing order list from api

  if(req.url.startsWith('/api/ordersList/') && req.method == 'GET'){
  
   let id= req.url.split('/')[3];
     
    db.query('SELECT userID FROM products WHERE id = ?', [id], (err, productResults) => { 
        if (err) {
            res.writeHead(500, { 'content-type': 'text/plain' });
            return res.end(err.message);
        }

        // Check if product exists
        if (!productResults || productResults.length === 0) {
            res.writeHead(404, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: 'Product not found' }));
        }

        let userID = productResults[0].userID;

        // 2. Second query: Get user details using that userID
        // (Note: Make sure your users table column is 'id' or 'userID' depending on your schema)
        db.query('SELECT * FROM users WHERE id = ?', [userID], (err, userResults) => {
            if (err) {
                res.writeHead(500, { 'content-type': 'text/plain' });
                return res.end(err.message);
            }

            // Check if user exists
            if ( userResults.length === 0) {
                res.writeHead(404, { 'content-type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'User not found' }));
            }

            let user = userResults[0];

            db.query('SELECT description FROM products WHERE id= ?', [id],(err, result)=>{
             
                if (err) {
                res.writeHead(500, { 'content-type': 'text/plain' });
                return res.end(err.message);
            }

            // Check if user exists
            if ( result.length === 0) {
                res.writeHead(404, { 'content-type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'products not found' }));
            }
          
            else{
               
              let products = result[0].description;
              // 3. Send response HERE (when data is actually ready)
            res.writeHead(200, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ success: true, data: user, products: products }));

            }
            })

          
        });
    });
    
    
    return;
  }

  //orders Info

  if(req.url.startsWith('/orderInfo.html') && req.method == 'GET'){
       
     
    let p= path.join(__dirname, 'public','orderInfo.html');

    fs.readFile(p, (err, data)=>{
       
      if(err){
          res.writeHead(404,{'content-type':'text/plain'})
          res.end(err.message)
      }

      else{
           res.writeHead(200,{'content-type':'text/html'})
          res.end(data)
      }
    })

    return;
  }

  //address saving

  if(req.url== '/api/saveAddress' && req.method == 'POST'){

     let body='';

    req.on('data', (chunks)=>{
      body+= chunks.toString();
    })

    req.on('end',()=>{
        let info= JSON.parse(body);

        let query= `UPDATE users SET phoneNumber = ?, city = ?, address = ? WHERE id = ?;` 

        let values= [info.phone, info.city, info.address,info.userId];

        db.query(query,values, (err,result)=>{
          if(err){ 
        res.writeHead(500,{'content-type': 'application/json'});
        res.end(JSON.stringify({success:false, message:err.message}));
        return;
         } 

      else{
        res.writeHead(200,{'content-type': 'application/json'});
        res.end(JSON.stringify({success:true,message:'database worked' }));
      }
        })
    })

    return;
  }

  //dashboard users page

  if(req.url == '/api/users' && req.method =='GET'){
       
    let query = `SELECT * FROM users`;

    db.query(query , (err, content)=>{

        if(err){ 
        res.writeHead(500,{'content-type': 'text/plain'});
        res.end(err.message);
      }

      else{
        res.writeHead(200,{'content-type': 'application/json'});
        res.end(JSON.stringify(content));
      }
    });

    return;
  }

  if(req.url == '/dashboard/users' && req.method == 'GET'){

    let filePath= path.join(__dirname, 'public', 'users.html');
    
     fs.readFile(filePath,(err,content)=>{
         
      if(err){
        res.writeHead(200,{'content-type': 'text/plain'});
        res.end(err.message);
      }

      else{
        res.writeHead(200,{'content-type': 'text/html'});
        res.end(content);
      }
     })
     
    return;
  }
   
  //login action 
  
  if(req.url == '/api/login' && req.method == 'POST'){

    let body='';

    req.on('data', (chunks)=>{
      body+= chunks.toString();
    })
    
    req.on('end', ()=>{

      let info = JSON.parse(body);

      let query = `select * from users where email= ?`;
      let values = [info.email];

      db.query(query, values , (err , result)=>{
       
        if(err){
           let message= {
              success : false,
              text: "error in database : " + err.message,
              name: null
            }
        res.writeHead(500,{'content-type': 'application/json'});
        res.end(JSON.stringify(message));
        }
         
        else{ 
           
          if(result.length == 0){
            let message= {
              success : false,
              text: "There is no E-mail like this",
              name: null
            }
            res.writeHead(400,{'content-type': 'application/json'});
            res.end(JSON.stringify(message));

            return;
          }

          user= result[0];
 
           if(user.password === info.password){
             let message= {
              success : true,
              text: "Welcome Back!",
              name: user.name,
              id: user.id
            }
             res.writeHead(200,{'content-type': 'application/json'});
             res.end(JSON.stringify(message));
          }

          else{
             let message= {
              success : false,
              text: "Incorrect Password",
              name: null
            }
            res.writeHead(401,{'content-type': 'application/json'});
            res.end(JSON.stringify(message));
          }
        }
      })
 
       
       
    })
    
    return;
  }


  //signing up & (otp)
  
  if(req.url == '/api/addUserData' && req.method== 'POST'){

    let body='';

    req.on('data',(chunks)=>{
      body+= chunks.toString();
    })

    req.on('end', ()=>{
        
      let info = JSON.parse(body);

       const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

       let values = [info.name, info.email, info.password];

       db.query(query , values , (err, info)=>{

        if(err){
         res.writeHead(500,{'content-type': 'text/plain'});
         res.end('error happened : '+ err.message);
        }

        else{
           res.writeHead(200,{'content-type': 'text/plain'});
           res.end("information inserted in database");
        }
       })

   
    })

    return;
  }

  
  if(req.url == '/api/sendOtp' && req.method == 'POST'){
    
    let body='';

    req.on('data', (chunks)=>{
     body+= chunks.toString();
    })

    req.on('end', ()=>{
      let obj= JSON.parse(body);

      const mailOptions = {
                    from: 'DesiBites <Desibites9977@gmail.com>',
                    to: obj.email,
                    subject: 'Your DesiBites Verification Code ',
                    text: `Hello! Your verification code for DesiBites is: ${obj.otp}`
             };
      
       transporter.sendMail(mailOptions, (error, info) => {
                    res.setHeader('Content-Type', 'application/json');
                    if (error) {
                        console.error('❌ Error sending email:', error.message);
                        res.writeHead(500);
                        res.end(JSON.stringify({ success: false, message: "Failed to send email" }));
                    } else {
                        console.log('✅ Email sent successfully!', info.response);
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, message: "OTP sent successfully!", serverOtp: obj.otp }));
                    }
                });
      });

      
    return;
  }
      

  //for inserting order

  if(req.url === '/api/orders/' && req.method === 'POST'){
  let body= '';// /api/orders/

  req.on('data', (chunk)=>{
    body+= chunk.toString();
  })

  req.on('end',()=>{

    const data= JSON.parse(body);
    //console.log(data)
    const pData = data.cartData;
    const cData= JSON.parse(pData)
    
    if(cData.length == 0 ){ 

      res.writeHead(400, {'content-type':'text/plain'});
      res.end("No items in the cart");
  
      return;
    }
     
    let address;
    
    let handleSuccess= false;

    db.query(`SELECT address FROM users WHERE id = ?`,[data.userId],(err,result)=>{
       
      if(err){
 
      console.log("err : "+ err.message);
      return;
    }
      if(result){
           // successCount= true;
           address = result;
           //console.log(result);
       }

    })
 
       const query = "INSERT INTO products ( name, price, description,address,userID) VALUES (?, ?, ?, ?,?)";
        const values = [ data.userName, data.price, pData, address,data.userId];

        db.query(query, values, (err,result)=>{


          if(result){
           // successCount= true;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({message: 'successfully data inserted'}));
          }

           if(err){
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({message: "db error :"+ err.message}));
            return;   
          }
        })
    });
 
    
  

   
  return;
  }

  //for deleting order 

  if(req.url.startsWith('/api/orders/') && req.method == 'DELETE'){

    const itemId= req.url.split('/')[3];

    const query= "DELETE FROM products WHERE id= ?";

    db.query(query,[itemId], (err, result)=>{
      
      if(err){
        res.writeHead(500, {'content-type': 'text/plain'});
        res.end("ERROR: "+ err.message);
      }

      else{
        res.writeHead(200, {'content-type': 'application/json'});
        res.end(JSON.stringify({success: true, result}));
      }

      
    });
    return;
  } 
  
  // ================= API ROUTE: GET ORDERS =================

   
  //for items data

  if(req.url.startsWith('/api/itemsData') && req.method == "DELETE"){
    
    let id = req.url.split('/')[3];
    let query= "DELETE FROM items WHERE id = ?";
    let values= [id];
    db.query(query,values,(err,result)=>{
      if(err){
        res.writeHead(500,{'content-type': 'text/plain'});
        res.end(err.message);
      }

      else{
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end("the item is deleted successfully");
      }

    })

    return;
  }

  if(req.url == "/api/itemsData" && req.method == "POST"){
    
    let body='';

    req.on('data', (chunks)=>{
      body+= chunks.toString();
    })

    req.on('end',()=>{

      let data= JSON.parse(body);

      let query=`INSERT INTO items (id, name, price, category, image,description) 
VALUES (?, ?, ?, ?, ?, ?);`;

    let values =[data.id,data.name, data.price, data.category, data.image, data.desc];

    db.query(query,values,(err,result)=>{

     if(err){
      res.writeHead(500,{'content-type':'text/plain'});
      res.end(err.message);
     }

     else{
      res.writeHead(200,{'content-type': 'text/plain'});
      res.end("the database worked ");
     }
    })
    })


    return;
  }

  if(req.url=="/api/itemsData" && req.method== 'GET'){

    db.query('SELECT * FROM items', (err, content)=>{
      if(err){
        res.writeHead(500, {'content-type' : 'text/plain'});
        res.end('Error accessing the database');

      }

      else{
        res.writeHead(200,{'content-type':'application/json'});
        res.end(JSON.stringify(content)); 
      }
    })

    return;
  }

  if (req.url === '/api/orders' && req.method === 'GET') {
    db.query('SELECT * FROM products', (err, results) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to fetch orders' }));
        return;
      }
      else{
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(results));
      }
    });
    return;
  }

  // ================= STATIC FILE SERVING =================
  let filePath = path.join(__dirname,'public', req.url === '/' ? 'index.html' : req.url);
  let extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Page Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 DesiBites Node server is running live at: http://localhost:${PORT}`);
});