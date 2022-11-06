const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// middlewere
app.use(cors())
app.use(express.json());

app.get('/',(req,res)=>{
    res.send('server successfully running')
})

const verifyToken = (req,res,next)=>{
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:'unauthorized'})
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err){
            return res.status(401).send({message:'unauthorized'})
        }
        req.decoded = decoded;
    })
    next();
}

const uri = "mongodb+srv://car-garage:car-garage@cluster0.wfzwlor.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async()=>{
    const productsCollection = client.db('car-garage-products').collection('products');
    const orderCollection = client.db('car-garage-products').collection('order')
    try{
        app.get('/services',async(req,res)=>{
            const query = {};
            const cursor = productsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get('/checkout/:id',async(req,res)=>{
            const id = req.params.id
            const query = {_id:ObjectId(id)}
            const result = await productsCollection.findOne(query);
            res.send(result);

        });
        app.post('/order',async(req,res)=>{
            const data = req.body;
            const result = await orderCollection.insertOne(data);
        });
        app.get('/order',verifyToken,async(req,res)=>{
            const decoder = req.decoded;
            if(decoder.email !== req.query.email){
                return res.status(401).send({message:'unauthorized'})
            }
            let query = {};
            // lets query by query with database email name ;
            if(req.query.email){
               query ={ email:req.query.email}
            };
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        app.delete('/order',async(req,res)=>{
            const id = req.query.id;
            const query = {_id:ObjectId(id)}
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        app.post('/jwt',(req,res)=>{
            const user = req.body;
            const token = jwt.sign(user,process.env.JWT_SECRET);
            res.send({token});
        })
       

    }
    finally{

    }

}

run().catch(err=>console.log(err))








app.listen(port,()=>{
    console.log('server is running on port 5000')
})