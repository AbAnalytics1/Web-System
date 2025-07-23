<?php

//permit CORS requests for multiple origins in PHP.
//code adapted from (Admin, 2023)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-Requested-with");
header("Content-Type: application/json; charset=utf-8");
//end of adapted code


// Connect to the database
$mysqli = new mysqli("localhost", "c2430556_J123007", "rIp-);lR3r6!l,w?", "c2430556_cjcollenette_unisites");


// Check for connection error
//code adapted from (Academy, 2023)
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}
//end of adapted code

// Check if this is a POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') 
{
   
    //if the request from javascript POST method is to register or login
    if ((isset($_POST['action']) && $_POST['action'] === 'register') || (isset($_POST['action']) && $_POST['action'] === 'login')) 
    {
        
        // Get the submitted username and password from the javascript FormData() method
        //escaping quotes using addslashes function
        $username = addslashes($_POST['username']); 
        $password = addslashes($_POST['password']);

        // Query the database to see if the user's usaranme exists before taking the necessary actions
        $query = $mysqli->prepare("SELECT id, username FROM users WHERE username = ?"); //Using prepared statemetns to prvent SQL injection. The question marks (?) are placeholders to prevent SQL injection
        $query->bind_param("s", $username); // Bind the actual values to the placeholders in the SQL statement. "s" means the parameter is a string ie. username 
        $query -> execute(); //execute the query
        $queryresult = $query->get_result(); // Get the result from the query statement

    
        // if the user is registering
        if (isset($_POST['action']) && $_POST['action'] === 'register'){

            // if our initital query returned rows then it means the user already exists in the db
            if ($queryresult->num_rows >0 ) {
                
                //send the response to the JS
                echo json_encode([
                    'action' => 'registration',
                    'status' => 'error',
                    'message' => 'Username already exists',
                ]);
                $query->close(); // Close the query statement
                exit; // Stop if user is already registered             
            }



            //do not hash password in php before saving (already hashed in js)
            $query = $mysqli->prepare("INSERT INTO users (username, password) VALUES (?, ?)"); //Using prepared statemetns to prvent SQL injection. The question marks (?) are placeholders to prevent SQL injection
            $query->bind_param("ss", $username, $password); // Bind the actual values to the placeholders in the SQL statement. "ss" means both parameters are strings: username and hashed password

            
            // if query executed successuflly
            if ($query -> execute()) { // Execute the prepared statement (this sends the query to the database)

                //get user id of the just executed insert query. We need to send the user ID reponse to JS for user sessions
                $newUserIdFromQuery = $mysqli -> insert_id;

                echo json_encode([
                        'action' => 'registration',
                        'status' => 'success',
                        'message' => 'Registration successful!',
                        'userIdFromQuery' => $newUserIdFromQuery
                    ]);
            } else {
                echo json_encode([
                    'action' => 'registration',
                    'status' => 'error',
                    'message' => 'Registration error. Please try again later!'
                ]);
            }
    
            // Close the statement to free up resources
            $query -> close();
        }

        //if the user is logging in
        else if (isset($_POST['action']) && $_POST['action'] === 'login'){
            
            //if user is logging in and our initial query to check the username reutrned no rows it means the user doesnt exist
            if ($queryresult->num_rows == 0) {
                    echo json_encode([
                        'action' => 'login',
                        'status'=> 'error',
                        'message'=> 'Account does not exist'
                    ]);
            }

            //if user is logging in and our initial query to check the username returned rows then it means the user exists so now we need to check the password
            else if ($queryresult->num_rows > 0){
                $query = $mysqli->prepare("SELECT id, password FROM users WHERE username = ?"); //Using prepared statemetns to prvent SQL injection. The question marks (?) are placeholders to prevent SQL injection
                $query->bind_param("s", $username); // Bind the actual values to the placeholders in the SQL statement. "s" means the parameter is a string ie. username 
                $query -> execute(); //execute the query
                $queryresult = $query->get_result(); // Get the result from the query statement

                //retrieve row from query statement into php array
                $queryDataArr = array();
                while ($row = $queryresult->fetch_assoc()) {
                    $queryDataArr[] = $row; // Each $row is an associative array of the current row
                }

                //get sql query id of user. We need to send the user ID reponse to JS for user sessions
                $user_id_from_db = $queryDataArr[0]['id']; 


                // if password was not hashed using php
                $password_from_db =  $queryDataArr[0]['password']; 
                if ($password == $password_from_db) { 
                    echo json_encode([
                        'action' => 'login',
                        'status' => 'success',
                        'message' => 'Login successful!',
                        'userIdFromQuery' => $user_id_from_db
                    ]);
                } 
                else {
                    echo json_encode([
                        'action' => 'login',
                        'status' => 'error',
                        'message' => 'Username or password incorrect'
                    ]);
                }

            }
        }  
    }

    //if the request from javascript POST method is to search the universities from the api
    else if (isset($_POST['action']) && $_POST['action'] === 'searchUni'){

        //get api url to fetch data from
        $apiUrl = $_POST['endpoint'];

        // Fetch from the API using file_get_contents
        $apiResponse = file_get_contents($apiUrl);

        /**Note: $apiResponse is already a JSON string from the API.When you put it inside json_encode(), 
         * it becomes a string inside a JSON object, not a nested object.
         * therefore: Decode the API response before putting it into message
        */
        // Decode the API response into a PHP array/object
        $apiData = json_decode($apiResponse,true); // true => associative array

        //send the api response to the JS
        echo json_encode([
            'action' => 'searchUni',
            'status' => 'success',
            'message' => $apiData
        ]);
    }


    //if the request from javascript POST method is to save the universities in the db
    else if (isset($_POST['action']) && $_POST['action'] === 'saveUni'){

        //get post body from js api call
        $uniName = $_POST['uniName']; 
        $uniWebsite = $_POST['uniWebsite'];
        $userID = $_POST['userID'];


        //we first need to check if the university doesnt already exist in the table
        $query = $mysqli->prepare("SELECT uni_id, name FROM unis WHERE name = ?"); //Using prepared statemetns to prvent SQL injection. The question marks (?) are placeholders to prevent SQL injection
        $query->bind_param("s", $uniName); // Bind the actual values to the placeholders in the SQL statement. "s" means the parameter is a string ie. uniName 
        $query -> execute(); //execute the query
        $queryresult = $query->get_result(); // Get the result from the query statement


        //if query returns rows it means the university already exisits in db
        if($queryresult->num_rows > 0){
          
            //we just need to get the uni id of the university in case we need to insert for the user's list
            $queryDataArr = array(); // Create a PHP array to store the rows

            // Fetch rows one by one and add to the array
            while ($row = $queryresult->fetch_assoc()) {
                 $queryDataArr[] = $row; // Each $row is an associative array of the current row
            }
            $uniIDFromQuery =  $queryDataArr[0]['uni_id'];    //get sql table column value from php array index 0
        }

        // if query is empty then we can insert our new university with the details
        else if ($queryresult->num_rows == 0){ 
            $query = $mysqli->prepare("INSERT INTO unis (name, website) VALUES (?, ?)"); //Using prepared statemetns to prvent SQL injection. The question marks (?) are placeholders to prevent SQL injection
            $query->bind_param("ss", $uniName, $uniWebsite); // Bind the actual values to the placeholders in the SQL statement. "ss" means both parameters are strings: uniName and uniWebsite

            // if query executed successuflly
            if ($query -> execute()) { // Execute the prepared statement (this sends the query to the database)

                //get id of the just executed insert query. We need this id to insert into another table
                $uniIDFromQuery = $mysqli -> insert_id;

                $query->close(); // Close the query statement

            } else {
                echo json_encode([
                    'action' => 'saveUni',
                    'status' => 'error',
                    'message' => 'Error saving uni details into tbl:unis'
                ]);
                exit; //terminate execution of script
            }
        }

        // if university details have been succesfully saved or do not have to because it already exists, we proceed to add the uni to the user's list

        //first we need to check if the user has already saved this univeristy to their list. if they have we do nothing else we insert the new item into their list
        $query = $mysqli->prepare("SELECT *  FROM user_unis WHERE user_id = ? AND uni_id = ? "); //Using prepared statemetns to prvent SQL injection. The question marks (?) are placeholders to prevent SQL injection
        $query->bind_param("ii", $userID, $uniIDFromQuery); // Bind the actual values to the placeholders in the SQL statement. "ii" means both parameters are integers
        $query -> execute(); //execute the query
        $queryresult = $query->get_result(); // Get the result from the query statement

        // if query executed successuflly
        if ($query -> execute()) { // Execute the prepared statement (this sends the query to the database)

            //if query executed we check if user has alaready saved uni to personal list
            if ($queryresult->num_rows > 0) {//if already saved to personal list
                echo json_encode([
                    'action'=>'saveUni', 
                    'status' => 'success', 
                    'message'=> 'University is already saved to your unique list',
                    'messageCode' => '10'
                ]);
            }

            //if user does not have this uni in their persoanl list then we need to save it
            else if ($queryresult->num_rows == 0) {
                
                $query->close(); // Close the previous query statement
                $query = $mysqli->prepare("INSERT INTO user_unis (user_id, uni_id) VALUES (?, ?)"); //Using prepared statemetns to prvent SQL injection. The question marks (?) are placeholders to prevent SQL injection
                $query->bind_param("ii", $userID, $uniIDFromQuery); // Bind the actual values to the placeholders in the SQL statement. "ii" means both parameters are integers
                
                //if query exeectuted successfylly
                if ($query -> execute()) { // Execute the prepared statement (this sends the query to the database)

                    //then finally send this reponse to the js
                    echo json_encode([
                        'action'=>'saveUni', 
                        'status' => 'success', 
                        'message'=> 'user succesffully saveed this uni to their personal list',
                        'messageCode' => '11'
                    ]);
                
                // if query failed to insert the new uni into user's personal list    
                } else {
                    echo json_encode([
                        'action' => 'saveUni',
                        'status' => 'error',
                        'message' => 'Error saving uni to user personal list'
                    ]);
                    exit; //terminate execution of script
                }
            }
        }  

        //if query failed to check if user already has saved this uni to their list
        else {
            echo json_encode([
                'action' => 'saveUni',
                'status' => 'error',
                'message' => 'Error checking if user already has uni in their unique list'
            ]);
            exit; //terminate execution of script
        }
        
    }

    //if the request from javascript POST method is to refresh the user's unique list
    else if (isset($_POST['action']) && $_POST['action'] === 'refreshUserList'){

        //get post body from js api call
        $userID = $_POST['userID']; 
        
        //prepare query to retrieve list
        $query = $mysqli->prepare(
        "SELECT tbl_user_unis.user_id, tbl_user_unis.uni_id, tbl_unis.name, tbl_unis.website 
                FROM `user_unis` as tbl_user_unis
                JOIN unis as tbl_unis
                ON tbl_unis.uni_id =  tbl_user_unis.uni_id
                WHERE tbl_user_unis.user_id = ?
                ORDER BY tbl_unis.name ASC
                "
            ); 
        
        $query->bind_param("i", $userID); // Bind the actual values to the placeholders in the SQL statement. "i" means the parameter is an integer ie. userID
        $query -> execute(); //execute the query
        $queryresult = $query->get_result(); // Get the result from the query statement

        
        // if query executed successuflly
        if ($query -> execute()) { 
            
            // send the query results as reposnse to the JS
            $querydata = $queryresult->fetch_all(MYSQLI_ASSOC);
            echo json_encode([
            'action' =>'refreshUserList',
            'status'=>'success',
            'queryData' => $querydata]);
        }

        //if query failed to execute
        else{
            echo json_encode([
                'action' =>'refreshUserList',
                'status'=>'error',
                'message' => 'Error trying to refresh user list from db'
            ]);
        }   
    }

    //if the request from javascript POST method is to delete a saved uni from the user's unique list
    else if (isset($_POST['action']) && $_POST['action'] === 'delUserSavedUni'){

        //get post body from js api call
        $userID = $_POST['userID'];
        $uniID = $_POST['uniID'];

        //prepare query to delete from user_unis table
        $query = $mysqli->prepare("DELETE FROM user_unis WHERE user_id = ? AND uni_id = ? "); //Using prepared statemetns to prvent SQL injection. The question marks (?) are placeholders to prevent SQL injection
        $query->bind_param("ii", $userID, $uniID); // Bind the actual values to the placeholders in the SQL statement. "ii" means both parameters are integers
        $query -> execute(); //execute the query
        $queryresult = $query->get_result(); // Get the result from the query statement

        // if query executed successuflly
        if ($query -> execute()) { 
            
            // send reposnse to the JS
            echo json_encode([
            'action' =>'delUserSavedUni',
            'status'=>'success',
            'message' => 'Uni successfully delete from user list']);
        }

        //if query failed to execute send response to JS
        else{
            echo json_encode([
                'action' =>'delUserSavedUni',
                'status'=>'error',
                'message' => 'Error trying to delete university from user list'
            ]);
        }   
    }


}
?>
 