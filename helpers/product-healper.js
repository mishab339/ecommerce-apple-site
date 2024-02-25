const { resolve, reject } = require('promise');
const mongoose = require('mongoose');
const connection = require('../config/connection');
const { response } = require('../app');
const usersConnection = require('../config/userConnection');
const orderConnection = require('../config/orderConnection');
module.exports={
    addProducts:(product,callback)=>{
        connection.insertMany(product).then((data)=>{
            console.log(data);
            callback(data[0]._id);
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products =  await connection.find().lean().exec();
            resolve(products);
        })
    },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            console.log(productId);
            connection.deleteOne({_id:productId}).then((response)=>{
                console.log(response);
                resolve(response);  
            });
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            connection.findOne({_id:prodId}).lean().exec().then((response)=>{
                console.log(response);
                resolve(response);
            });
        });
    },
    updateProduct:(prodId,details)=>{
        console.log(details);
        return new Promise((resolve,reject)=>{
            connection.findOneAndUpdate({_id:prodId},{$set:{
                Name:details.Name,
                Catorgery:details.Catorgery,
                Price:details.Price,
                Discription:details.Discription
            }}).then((response)=>{
                // console.log(response);
                resolve(response);
            })
        })
    },
    getAllusersDetails:()=>{
        return new Promise(async(resolve,reject)=>{
          let userDetails = await  usersConnection.find().lean().exec();
          resolve(userDetails);
        })
    },
    getUserOrderDetails:(userId)=>{
        return new Promise((resolve,reject)=>{
            let userOredr =  orderConnection.find({userId:new mongoose.Types.ObjectId(userId)}).lean().exec();
            resolve(userOredr);
        })
    },
    changeOrderStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            orderConnection.findOneAndUpdate({_id:new mongoose.Types.ObjectId(orderId)},
            {
                $set:{status:'shipped'}
            }).then((response)=>{
                resolve(response)

            })
           
        })
    },
    getOrderProducts:(procuctId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await orderConnection.aggregate([
                {
                    $match:{
                        _id:new mongoose.Types.ObjectId(procuctId)
                    }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:'productdetails',
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).exec();
            // console.log(orderItems);
            resolve(orderItems);
           })
         }
    }  
