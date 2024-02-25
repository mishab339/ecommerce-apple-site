const { resolve, reject } = require('promise');
const usersConnection = require('../config/userConnection');
const addToCartConnection= require('../config/addToCartConnection');
const orderConnection= require('../config/orderConnection');
const bcrypt = require('bcrypt');
const ccxt = require('ccxt');
const Razorpay = require('razorpay');
const { response } = require('../app');
const { default: mongoose, mongo } = require('mongoose');
var instance = new Razorpay({
    key_id: 'rzp_test_nf9yvzj9J8Yvh3',
    key_secret: 'fChNfgttaeT2S4QevfP39Lwb',
  });
module.exports={
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10);
            usersConnection.insertMany(userData).then((data)=>{
                // console.log(data);
                resolve(data[0]);
            });
        })
    },
    doLogin:(userData)=>{
       return new Promise(async (resolve,reject)=>{
        let loginStatus = false;
        let response={};
        const user = await usersConnection.findOne({Email:userData.Email});
        if(user){
            bcrypt.compare(userData.Password,user.Password).then((status)=>{
                if(status){
                    console.log('login successfull..');
                    response.user=user;
                    response.status=true;
                    console.log(response);
                    resolve(response);
                }else{
                    console.log('login failed..');
                    resolve({status:false});
                }
            })
        }else{
            console.log('user not found...');
            resolve({status:false});
        }
       })
    },
    addToCart:(productId,userId)=>{
        let proObj={
            item:new mongoose.Types.ObjectId(productId),
            quantity:1
        }
        return new Promise(async (resolve,reject)=>{
            let userCart = await addToCartConnection.findOne({user:new mongoose.Types.ObjectId(userId)});
            // console.log(userCart);
            if(userCart){
                let productExist=userCart.products.findIndex(product=> product.item==productId);
                // console.log(productExist);
                // console.log(new mongoose.Types.ObjectId(productId));
                if(productExist!=-1){
                    await addToCartConnection.updateOne({user:new mongoose.Types.ObjectId(userId),'products.item':new mongoose.Types.ObjectId(productId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then(()=>{
                        resolve();
                    })
                    }else{

                    
               
               addToCartConnection.findOneAndUpdate({user:userId},
                {$push:{
                     products:proObj    
                }
            }).then((response)=>{
                resolve()
            })
            }
            }else{
                let cartObj={
                    user:userId,
                    products:proObj
                }
                addToCartConnection.insertMany(cartObj).then((response)=>{
                    console.log(response);
                    resolve(response);
                })  
            }     
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let cartItems=await addToCartConnection.aggregate([
                {
                    $match:{
                        user:new mongoose.Types.ObjectId(userId)
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
                // {
                //    $lookup:{
                //     from:'productdetails',
                //     let:({prodList:'$products'}),
                //     pipeline:[
                //         {
                //             $match:{
                //                 $expr:{
                //                     $in:['$_id','$$prodList']
                //                 }
                //             }
                //         }
                //     ],
                //     as:'cartItems'
                //    }
                // }
            ]).exec();
            // console.log(cartItems);
            resolve(cartItems);
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0;
            let cart = await addToCartConnection.findOne({user:new mongoose.Types.ObjectId(userId)});
            if(cart){
                count=cart.products.length
            }
            resolve(count);
        })
    },
    changeProductQuantity:(details)=>{
        
        details.count = parseInt(details.count);
        details.quantity=parseInt(details.quantity)
        return new Promise(async(resolve,reject)=>{
            if(details.count==-1&&details.quantity==1){
                await addToCartConnection.updateOne({_id:new mongoose.Types.ObjectId(details.cart)},
                {
                    $pull:{products:{item:new mongoose.Types.ObjectId(details.product)}}
                }).then((response)=>{
                    resolve({removeProduct:true,response});
                })
            }else{
                await addToCartConnection.updateOne({_id:new mongoose.Types.ObjectId(details.cart),'products.item':new mongoose.Types.ObjectId(details.product)},
                {
                    $inc:{'products.$.quantity':details.count}
                }).then((response)=>{
                    resolve({status:true});
                })
            }
            
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let total=await addToCartConnection.aggregate([
                {
                    $match:{
                        user:new mongoose.Types.ObjectId(userId)
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
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$product.Price']}}
                    }
                }
            ]).exec();
            // console.log(total[0].total);
            resolve(total[0].total);
    })
 },
 placeOrder:(order,products,totalPrice)=>{
   return new Promise((resolve,reject)=>{
    // console.log(order,products,totalPrice);
    let status = order['payment-method']==='COD'?'placed':'pending';
    let orderObj={
         deliveryDetails:{
            mobile:order.mobile,
            address:order.address,
            pincode:order.pincode
         },
         userId:new mongoose.Types.ObjectId(order.userId),
         paymentMethod:order['payment-method'],
         products:products,
         totalAmount:totalPrice,
         status:status,
         date:new Date()
    }
     orderConnection.collection.insertOne(orderObj).then((response)=>{
        addToCartConnection.collection.deleteOne({user:new mongoose.Types.ObjectId(order.userId)});
        // console.log(response.insertedId);
        resolve(response.insertedId);
    })
   })
 },
 getCartProductsList:(userId)=>{
    return new Promise(async (resolve,reject)=>{
        let cart = await addToCartConnection.findOne({user:new mongoose.Types.ObjectId(userId)});
        console.log(cart.products);
        resolve(cart.products);
    })
 },
 getUserOrder:(userId)=>{
    return new Promise(async (resolve,reject)=>{
        console.log(userId);
       let orders = await orderConnection.find({userId:new mongoose.Types.ObjectId(userId)}).lean().exec();
    //    console.log(orders);
       resolve(orders);
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
 },
 genarateRazorpay:(orderId,total)=>{
  return new Promise((resolve,reject)=>{
// var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

instance.orders.create({
amount: total,
currency: "INR",
receipt: orderId,
notes: {
    key1: "value3",
    key2: "value2"
}
},(err,order)=>{
    if(order){
        console.log(order);
        resolve(order);
    }else{
        console.log(err)
    } 
})
})
 },
 verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', 'fChNfgttaeT2S4QevfP39Lwb');
        hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
        // console.log("Hmac is: " + hmac.digest('hex'))
        hmac=hmac.digest('hex')
        if(hmac==details['payment[razorpay_signature]']){
            resolve();
        }else{
            reject()
        };
    })
 },
 changePaymentStatus:(orderId)=>{
    console.log(orderId);
    return new Promise((resolve,reject)=>{
        orderConnection.collection.updateOne({_id:new mongoose.Types.ObjectId(orderId)},
        {
            $set:{
                status:'placed'
            }
        }
        ).then(()=>{
            resolve();
        })
    })
 },
 removeCartItems:(cartId,prodId)=>{
    return new Promise(async(resolve,reject)=>{
        addToCartConnection.updateOne({_id:new mongoose.Types.ObjectId(cartId)},{
        $pull:{
            products:{item:new mongoose.Types.ObjectId(prodId)}
        }
       }).then((response)=>{
        console.log(response)
        resolve(response)
       })
    

    })
 }
    
}