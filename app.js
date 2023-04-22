const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const {mongoose}=require("./db/mongoose");


const {List,Task,User}=require('./db/models');


app.use(bodyParser.json());

//CORS Policy
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Methods", "GET,POST,HEAD,OPTIONS,PUT,PATCH,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  
  
//Read
app.get('/lists',(req,res)=>{
   List.find({}).then((lists)=>{
    res.send(lists);

   })


});


//Create
app.post('/lists',(req,res)=>{
   let title=req.body.title;
   let newList=new List({
    title
   })
 
   newList.save().then((listDoc)=>{
    res.send(listDoc);


   })
 });


 
 //Update
app.patch('/lists/:id',(req,res)=>{
    
    List.findByIdAndUpdate({_id:req.params.id},{
        $set:req.body
    }).then(()=>{
        res.send({'message':"Updated Successfully!!!"});
         
    })
 
 
 });


 // Delete
app.delete('/lists/:id',(req,res)=>{
    List.findOneAndRemove({
        _id:req.params.id
    }).then((removedListDoc)=>{
        res.send(removedListDoc);

    })
 
 
 });
 


 
 // Get all tasks in a specified list
 
 app.get('/lists/:listId/tasks',(req,res)=>{
    Task.find(
        {
            _listId:req.params.listId
        }
    ).then((tasks)=>{
        res.send(tasks);

    })
 });


 // Find about a specific task
 app.get('/lists/:listId/tasks/:taskId',(req,res)=>{
    Task.findOne({
        _id:req.params.taskId,
        _listId:req.params.listId

    }).then((task)=>{
        res.send(task);

    })
}
);

 // Create a task in a specific list
 app.post('/lists/:listId/tasks',(req,res)=>{
    let newTask=new Task({
        _listId:req.params.listId,
        title:req.body.title
    });

    newTask.save().then((newTaskDoc)=>{
        res.send(newTaskDoc);
    })
 });


  // Update a specific task in a list

  app.patch('/lists/:listId/tasks/:taskId',(req,res)=>{
    Task.findByIdAndUpdate({
        _id:req.params.taskId,
        _listId:req.params.listId
    },
    {
        $set:req.body
    }).then(()=>{
        res.send({message:"Updated successfully!!!"});
    })
  });

  //Delete a specific task from the list

  app.delete('/lists/:listId/tasks/:taskId',(req,res)=>{
    Task.findOneAndRemove({
        _id:req.params.taskId,
        _listId:req.params.listId

    }).then((removedTaskDoc)=>{
        res.send(removedTaskDoc);

    })
}
);

// User Routes



// Post Users , Purpose: Sign Up


app.post('/users',(req,res)=>{
    // Users sign up

    let body=req.body;
    let newUser=new User(body);
    newUser.save().then(()=>{
        return newUser.createSession();

    }).then((refreshToken)=>{
        // Session created successfully- refreshToken returned
        //now we generate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken)=>{
            return {accessToken,refreshToken};

        })
    }).then((authTokens)=>{
        res
            .header("x-refresh-token",authTokens.refreshToken)
            .header("x-access-token",authTokens.accessToken)
            .send(newUser);
    }).catch((e)=>{
        res.status(400).send(e);

    });
})

// Post /users/login

//Purpose: Login

app.post('/users/login',(req,res)=>{
    let email=req.body.email;
    let password=req.body.password;

    User.findByCredentials(email,password).then((user)=>{
        return user.createSession().then((refreshToken)=>{
            return user.generateAccessAuthToken().then((accessToken)=>{
                return {accessToken,refreshToken};
            });
        }).then((authToken)=>{

            res
                .header("x-refresh-token",authToken.refreshToken)
                .header("x-access-token",authToken.accessToken)
                .send(newUser);

        }).catch((e)=>{
            res.status(400).send(e);
    
        });
    })

})

app.listen(3000,()=>{
    console.log("Server is listening on port 3000");

})