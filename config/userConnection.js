const mongoose = require('mongoose');
const connect = mongoose.connect('mongodb://localhost:27017/shoping');
connect.then(()=>{
    console.log('Database connected...');
}).catch(()=>{
    console.log('database cannot be connected..')
});
const  singupSchema = new mongoose.Schema({
    Name:{
      type:String,
      required:true
    },
    Email:{
        type:String,
        required:true
    },
    Password:{
       type:String,
       required:true
    }
});
const usersConnection = new mongoose.model('userData',singupSchema);
module.exports = usersConnection;