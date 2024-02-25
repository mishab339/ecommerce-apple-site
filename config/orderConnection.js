const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const connect = mongoose.connect('mongodb://localhost:27017/shoping');
connect.then(()=>{
    console.log('Database connected...');
}).catch(()=>{
    console.log('database cannot be connected..')
})
const orderSchema= new mongoose.Schema({
   'deliveryDetails.mobile':{
          type:Number,
   },
   'deliveryDetails.address':{
    type:String
   },
   'deliveryDetails.pincode':{
    type:Number
   },
   userId:{
    type:ObjectId
   },
   paymentMethod:{
    type:String
   },
   products:{
    type:Object
   },
   totalAmount:{
     type:Number
   },
   status:{
    type:String
   }

})
// let ordetObj={
//     deliveryDetails:{
//        mobile:order.mobile,
//        address:order.address,
//        pincode:order.pincode
//     },
//     userId:new mongoose.Types.ObjectId(order.userId),
//     paymentMethod:order.payment-method,
//     products:products,
//     status:status
// }
const orderConnection = new mongoose.model('orderCollection',orderSchema);
module.exports=orderConnection;