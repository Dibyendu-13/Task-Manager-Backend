const { reject } = require("lodash");
const mongoose=require("mongoose");
const jwt=require ("jsonwebtoken");
const { reset } = require("nodemon");
const crypto=require('crypto');
const jwtsecret="83228509620391249027gjgjhgkjhkhkhjk698798873238704";
const bcrypt=require('bcryptjs');
const _=require("lodash");

const UserSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        minlength:1,
        trim:true,
        unique:true,

    }

    ,password:{
        type:String,
        required:true,
        minlength:8
    },
    sessions:[
        {
            token:{
                type:String,
                required:true
            },
            expiresAt:{
                type:Number,
                required:true
            }
        }
    ]
});


//Instance Methods
UserSchema.methods.toJSON=function(){
  
    const user=this;
    const userObject=user.toObject();

    //return the document except passwords and sessions (these shouldn't be available)

    return _.omit(userObject,['password','sessions']);
}


UserSchema.methods.generateAccessAuthToken=function()
{
    const user=this;
    return new Promise((resolve,reject)=>{
        //Create the JSON web token and return that
        jwt.sign({_id:user._id.toHexString()},jwtsecret,{expiresIn:"15m"},(err,token)=>{

            if(!err)
            {
                resolve(token);
            }
            else{
                reject();
            }
        })
    })
}

UserSchema.methods.generateRefreshAuthToken=function(){
    return new Promise((resolve,reject)=>{
        crypto.randomBytes(64,(err,buf)=>{
            if(!err)
            {
                let token =buf.toString('hex');
                return resolve(token);
            }
           
        })
    })
}

UserSchema.methods.createSession=function(){
    let user=this;
    return user.generateRefreshTokenExpiryTime().then((refreshToken)=>{
        return saveSessionToDatabase(user,refreshToken);

    }).then((refreshToken)=>{
        //saved to db successfully
        // now return the refresh token
        return refreshToken;
    }).catch((e)=>{
        return Promise.reject('Failed to save session to db.\n'+e);
    });

}


//Model Methods(static methods)
UserSchema.statics.findByIdAndToken=function(_id,token)
{
    const User=this;

    return User.findOne({
        _id,
        'session.token':token
    });
}

UserSchema.statics.findByCredentials=function(email,password){
  let User=this;
  return User.findOne({email}).then((user)=>
  {
    if(!user) return Promise.reject();

    return new Promise((resolve,reject)=>{
        bcrypt.compare(password,user.password,(err,res)=>{
            if(res) resolve(user);
            else{
                reject();
            }
        })
    })
  })
}

UserSchema.statics.hasRefreshTokenExpired=(expiresAt)=>{
    let secondsSinceEpoch=Date.now()/1000;

    if(expiresAt>secondsSinceEpoch)
    {
        //hasnt expired
        return false;
    }
    else{

        //has expired
        return true;

    }
}
//Middlewares

UserSchema.pre('save',function(next){
    let user=this;
    let costFactor=10;

    if(user.isModified('password'))
    {
        //if the password field has been edited/changed
        // Generate salt and password

        bcrypt.genSalt(costFactor,(err,salt)=>{
            bcrypt.hash(user.password,salt,(err,hash)=>{
                if(!err)
                {
                    user.password=hash;
                    next();
                }
               
            })
        })
    }
    else
    {
        next();

    }
});
// Helper Methods
let saveSessionToDatabase=(user,refreshToken)=>{
    //save session to db
    return new Promise((resolve,reject)=>{
        let expiresAt=generateRefreshTokenExpiryTime();

        user.sessions.push({'token':refreshToken,expiresAt});

        user.save().then(()=>{
            //save session successfully
            return resolve(refreshToken);
        }).catch((e)=>{
            reject(e);
        });
    })
}




let generateRefreshTokenExpiryTime=()=>{
    let daysUntilExpire=10;
    let secondsUntilExpire=((daysUntilExpire*24)*60)*60;


    return ((Date.now()/1000)+secondsUntilExpire);
}



const User=mongoose.model('User',UserSchema);

module.exports={User};  