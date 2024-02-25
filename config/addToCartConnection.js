const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const connect = mongoose.connect('mongodb://localhost:27017/shoping');
connect.then(()=>{
    console.log('Database connected...');
}).catch(()=>{
    console.log('database cannot be connected..')
})
const cartSchema = new mongoose.Schema({
    user:{
        type:ObjectId,
        required:true
    },
    products:{
        type:Array,
        required:true
    }
    
})

const addToCartConnection = new mongoose.model('cartCollection',cartSchema);

module.exports = addToCartConnection;
