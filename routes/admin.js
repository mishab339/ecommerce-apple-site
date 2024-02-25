var express = require('express');
// const {render} = require('../app');
const { route } = require('./user');
var router = express.Router();
var productHealpers = require('../helpers/product-healper');
var userHealpers = require('../helpers/user-healpers');
const { rawListeners, response } = require('../app');
const { pro } = require('ccxt');
const verifyAdminLogin=(req,res,next)=>{
  if(req.session.admin){
    next();
  }else{
    res.render('admin/login');
  }
}
const credential={
  Name:'Admin',
  Email:'admin123@gmail.com',
  Password:1234
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.admin){
    productHealpers.getAllProducts().then((products)=>{
      // console.log(products);
      res.render('admin/view-products',{admin:req.session.admin,products});
    });
  }else{
    res.render('admin/login',{admin:true});
  }
});
router.get('/add-product',verifyAdminLogin,function(req,res){
  res.render('admin/add-product',{admin:req.session.admin});
})
router.post('/add-product',function(req,res){
  console.log(req.body);
  console.log(req.files.Image)
  productHealpers.addProducts(req.body,(id)=>{
    let image = req.files.Image;
    console.log(id);
    image.mv('./public/product-images/'+id+'.png',(err,done)=>{
    if(!err){
      res.render('admin/add-product',{admin:req.session.admin});
    }else{
      console.log(err);
    }
  });
  });
});
router.get('/delete-product/:id',verifyAdminLogin,(req,res)=>{
let productId = req.params.id;
console.log(productId);
productHealpers.deleteProduct(productId).then((response)=>{
  res.redirect('/admin/')
})
});
router.get('/edit-product/:id',verifyAdminLogin,async (req,res)=>{
  let products =await productHealpers.getProductDetails(req.params.id);
  console.log(products);
  res.render('admin/edit-product',{products,admin:req.session.admin});
});
router.post('/edit-product/:id',async (req,res)=>{
  console.log(req.params.id);
  productHealpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/');
    if(req.files.Image){
      let image = req.files.Image;
      let id = req.params.id
      image.mv('./public/product-images/'+id+'.png')
    }
  });
});

router.get('/login',(req,res)=>{
 res.render('admin/login');
});
router.post('/login',(req,res)=>{
  console.log(req.body);
if(req.body.Email==credential.Email && req.body.Password==credential.Password){
  productHealpers.getAllProducts().then((products)=>{
    req.session.admin=credential.Name;
    req.session.admin.loggedIn=credential.Name;
    // console.log(products);
    res.redirect('/admin');
  });
}
})
router.get('/logout',(req,res)=>{
  req.session.admin=null;
  res.redirect('/')
});
router.get('/all-users',async(req,res)=>{
  productHealpers.getAllusersDetails().then(async(response)=>{
        res.render('admin/all-users',{admin:req.session.admin,userDetails:response});
    })
  });

router.get('/view-user-order-details/:id',(req,res)=>{
  productHealpers.getUserOrderDetails(req.params.id).then((response)=>{
    res.render('admin/user-order-details',{admin:req.session.admin,orderDetails:response});
  })
 })
router.post('/change-status',(req,res)=>{
    productHealpers.changeOrderStatus(req.body.orderId).then((response)=>{
    res.json({response:true})
  })
});
router.get('/view-order-products/:id',async(req,res)=>{
  let products = await productHealpers.getOrderProducts(req.params.id);
  res.render('admin/view-order-product',{products,admin:req.session.admin});
})
module.exports = router;
