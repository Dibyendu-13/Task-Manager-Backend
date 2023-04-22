const mongoose=require("mongoose");
mongoose.Promise=global.Promise;
mongoose.connect('mongodb://127.0.0.1:27017/TaskManager',{useNewUrlParser:true}).then(()=>{
    console.log("Connected to MongoDB successfully!!! ")
}).catch((e)=>{
    console.log("Error while connecting to MongoDB ");
    console.log(e);

});


// To prevent deprected warnings


mongoose.exports=
{
    mongoose
};
