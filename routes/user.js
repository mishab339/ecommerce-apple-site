var express = require('express');

 const {render, rawListeners, response} = require('../app');
var router = express.Router();
var productHealpers = require('../helpers/product-healper');
var userHealpers = require('../helpers/user-healpers');
const { route } = require('./admin');
const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}
router.get('/',async function(req, res, next) {
  let user = req.session.user
  // console.log(req.session);
  let cartCount = null;
  if(req.session.user){
     cartCount=await userHealpers.getCartCount(req.session.user._id);
  }
  
  productHealpers.getAllProducts().then((products)=>{
    console.log(products)
    res.render('user/view-products',{admin:false,products,user,cartCount});
  });
});
router.get('/login',(req,res)=>{
  if(req.session.user){
     res.redirect('/'); 
    console.log('session not cleared...');
  }else{
     res.render('user/login',{loginError:req.session.userLoginError});
      req.session.userLoginError=false
    }
});
router.get('/signup',(req,res)=>{
  if(req.session.user){
    res.redirect('/');
  }else{
    res.render('user/signup');
  }
  
});
router.post('/signup',(req,res)=>{
 userHealpers.doSignup(req.body).then((response)=>{
  // console.log(response);
  req.session.user=response;
  req.session.user.loggedIn=true; 
  res.redirect('/');
 })
});
router.post('/login',(req,res)=>{
  userHealpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user=response.user;
      req.session.user.loggedIn=true;
      console.log('session is'+req.session.user.loggedIn);
      res.redirect('/');
    }else{
      req.session.userLoginError="invalid user name or password"
       res.redirect('/login');
    }
  })
});
router.get('/logout',(req,res)=>{
  req.session.user=null;
  res.redirect('/')
});
router.get('/cart',verifyLogin,async (req,res)=>{
  // console.log(req.session.user);
  let products=await userHealpers.getCartProducts(req.session.user._id);
  let totalValue=0;
  if(products.length>0){
     totalValue= await userHealpers.getTotalAmount(req.session.user._id);
  }
  console.log(products);
  res.render('user/cart',{products,user:req.session.user,totalValue});
});
router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  // console.log(req.params.id,req.session.user._id);
//  console.log('api call..');
  userHealpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    // res.redirect('/');
    res.json({status:true}); 
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  userHealpers.changeProductQuantity(req.body).then(async (response)=>{
    let products=await userHealpers.getCartProducts(req.session.user._id);
    if(products.length>0){
      response.total=await userHealpers.getTotalAmount(req.body.user);
      res.json(response);
  }else{
    response.total=0;
    res.json(response);
  }
})
    
});
router.get('/place-order',verifyLogin,async (req,res)=>{
  let total= await userHealpers.getTotalAmount(req.session.user._id);
  res.render('user/place-order',{total,user:req.session.user});
});
router.post('/place-order', async(req,res)=>{
  console.log(req.body);
  let products = await userHealpers.getCartProductsList(req.body.userId);
  let totalPrice = await userHealpers.getTotalAmount(req.body.userId);
  userHealpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
       res.json({codSuccess:true})
    }else{
      userHealpers.genarateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response);
      })
    }
  })
  // console.log(req.body);
});
router.get('/order-success',(req,res)=>{
res.render('user/order-success',{user:req.session.user});
})
router.get('/orders',async (req,res)=>{
  let orders = await userHealpers.getUserOrder(req.session.user._id);
  res.render('user/orders',{user:req.session.user,orders});
});
router.get('/view-order-products/:id',async(req,res)=>{
  console.log(req.params.id);
  let products = await userHealpers.getOrderProducts(req.params.id);
  console.log(products);
  res.render('user/view-order-products',{products,user:req.session.user});
})
router.post('/verify-payment',(req,res)=>{
   console.log(req.body);
  userHealpers.verifyPayment(req.body).then(()=>{
    userHealpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log('payment successful...');
      res.json({status:true});
    })
  }).catch((err)=>{
      console.log(err);
      res.json({status:false});
  })
})
router.get('/remove-cart-items',(req,res,next)=>{
  console.log(req.query);
  userHealpers.removeCartItems(req.query.cartId,req.query.prodId).then((response)=>{
    res.json(response);
  });
});

module.exports = router;

