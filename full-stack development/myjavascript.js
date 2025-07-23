//defining the endpoint for php db config and commands
const server =
  "http://2430556.linux.studentwebserver.co.uk/J123007/J123007.php/";

//defining the endpoint for the universities api
const unisAPI =
  "https://jcollenette.linux.studentwebserver.co.uk/CO7006API/Universities.php/search?name=";

window.onload = function () {
  //this function checks if the browswer supports the crypto api for securing passwords
  checkBrowserSupportForCypto();

  // an event listener that searches the university when the user clicks enter in the university search box
  var uniSearchBtn = document.getElementById("inputSearchUni");
  uniSearchBtn.addEventListener("keypress", function (event) {
    // If the user presses the "Enter" key on the keyboard

    //code adapted from (W3Schools.com, n.d.)
    if (event.key === "Enter") {
      event.preventDefault(); // Cancel the default action, if needed
      searchUniversity();
    }
    //end of adapted code
  });

  //setting welcome message and logout button status on the universities page depending on guest or authenticated user
  //handle errors using the try..catch block
  //code adapted from (Kantor, n.d.)
  try {
    var _username = sessionStorage.getItem("sessionStorageUsername"); //get username from session storgae
    var msg;

    //if authenticated user
    if (_username) {
      msg = "Welcome, " + _username;
      document.getElementById("btnLogout").disabled = false; //enable logout button
      document.getElementById("btnLanding").disabled = true; //disable home button as we'd rather user logs out
      document.getElementById("btnLanding").style.display = "none"; //hide home button
      document.getElementById("userListTitle").style.display = "flex"; //display user list title

      //refresh user's personalised list
      refreshUserUniqueList();
    }

    //if no username in session storage (Guest)
    else {
      msg = "Welcome Guest";
      document.getElementById("btnLogout").disabled = true; //disable logout button
      document.getElementById("btnLogout").style.display = "none"; //hide the logout button
      document.getElementById("userListTitle").style.display = "none"; //hide user list title
    }

    //assign welcome message
    document.getElementById("welcomeMsg").textContent = msg;
  } catch (error) {
    //if no user has been stored in session storage
    console.log("No user stored in session storage");
  }
  //end of adapted code
};

//login/signup button
/** the function is an async function because we hash password using crypto api.
 * hashPassword() is async function because inside it, the crypto.subtle.digest() is asynchronous, so hashPassword() returns a Promise, not a string.
 * Since hashPassword() is async, you must wait for it to resolve before using the result.*/

//code adapted from (W3Schools.com, n.d.-b)
async function handleSubmit(event, action) {
  event.preventDefault(); // stop the default form submission

  //if user wants to view universities as a guest open universities page
  if (action == "guest") {
    sessionStorage.clear(); //clear sessions for previously logged in user

    window.open("universities.html", "_self"); //navigate to universities page
  }

  //if user wants to view universities by logging in or registering
  else if (action == "login" || action == "register") {
    //handle errors using the try..catch block
    //code adapted from (Kantor, n.d.)
    try {
      // Grab the form and inputs
      // const form = document.getElementById("myForm");
      const username = document.getElementById("username1").value.trim();
      var password = document.getElementById("password1").value.trim(); //set to var because we will be reassigning the hashed password to this variable
      const actionInput = document.getElementById("actionInput");

      // Check required fields
      if (!username || !password) {
        alert("Username and password are required.");
        return;
      }

      //hash the password using the crypto api. Since hashPassword() is async therefore we must wait for it to resolve before using the result.
      password = await hashPassword(password);
      //end of adapted code

      //send form data
      //code adapted from (Kantor, n.d.-b)
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("action", action); // e.g., login or register
      //end of adapted code

      // Set hidden field and submit
      actionInput.value = action;

      // fetch from the server
      //code adapted from (W3Schools.com, n.d.-c)
      fetch(server, {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.action == "registration") {
            if (data.status == "error") {
              alert(data.message);
            } else {
              //store user name in storage session
              sessionStorage.setItem("sessionStorageUsername", username);

              //store user id in storage session
              sessionStorage.setItem(
                "sessionStorageUserID",
                data.userIdFromQuery
              );

              //navigate to universities page
              window.open("universities.html", "_self");
            }
          } else if (data.action == "login") {
            if (data.status == "error") {
              alert(data.message);
            } else {
              //store username in storage session
              sessionStorage.setItem("sessionStorageUsername", username);

              //store user id in storage session
              sessionStorage.setItem(
                "sessionStorageUserID",
                data.userIdFromQuery
              );

              //navigate to universities page
              window.open("universities.html", "_self");
            }
          }
        })
        .catch((error) => {
          console.log("error message1: ", error);
          // resultDiv.innerHTML = `<p style="color: red;">Something went wrong.</p>`;
        });
    } catch (e) {
      console.error("Try block error: Error during form submission:", e);
    }
  }
  //end of adapted code
}

//the function below is invoked when the user clicks the search button for the university.
//to invoke the function as the user types in the search box, use the commnands inside the window.onload function below
function searchUniversity() {
  const searchBox = document.getElementById("inputSearchUni");
  const searchListContainer = document.getElementById("uniResults");
  var searchTxt = searchBox.value;

  //check if user is authenticated or a guest. We may need this later for saving the universities
  var _userSessionUsername = sessionStorage.getItem("sessionStorageUsername");
  var _userSessionUserID = sessionStorage.getItem("sessionStorageUserID");

  //update the user of the search status
  document.getElementById("searchStatus").textContent = "Searching ....";

  //define data to include in the body of the POST method
  //code adapted from (Kantor, n.d.-b)
  const postData = new FormData();
  postData.append("action", "searchUni");
  postData.append("endpoint", unisAPI + encodeURIComponent(searchTxt)); //encode the url properly to change spaces in url to %20 eg. university of chester => university%20of%20chester

  //handle errors using the try..catch block
  //code adapted from (Kantor, n.d.)
  try {
    // fetch from the server
    //code adapted from (W3Schools.com, n.d.-c)
    fetch(server, {
      method: "POST",
      body: postData,
    })
      .then((response) => response.json())
      .then((data) => {
        var universityList = data.message;

        //if no search returned no results
        if (universityList.length == 0) {
          //update the user of the search status
          document.getElementById("searchStatus").textContent =
            "No results found";

          // Clear previous search results in the list
          searchListContainer.innerHTML = "";
        }

        //if search returned results
        else {
          // Clear previous search results in the list
          searchListContainer.innerHTML = "";

          //track number of results to use in our html
          var searchResultCounter = 0;

          // Loop through the object keys (which are the IDs of the universities)
          for (const universityID in universityList) {
            searchResultCounter++; //increase search result counter by 1

            if (universityList.hasOwnProperty(universityID)) {
              // Get the university object
              const universityObject = universityList[universityID];

              //store the contents of the university item
              var uniID = universityID;
              var uniName = universityObject.name;
              var uniWebsite = universityObject.domains;
              var uniCountry = universityObject.country;

              /**create hyperlink from the university website:
               *Note: some universities have multiple domains and is a string with comma-separated domains not array )*/

              //code adapted from (Malik, 2023)
              let uniDomainLinks = uniWebsite
                .map((domain) => {
                  return `<a href="http://www.${domain}" target="_blank">${domain}</a>`;
                })
                .join(", ");

              //create a university list item to be added to the search list container
              const uniListItem = document.createElement("li");

              //design our search result list item

              //if user is guest, remove save button next to list items
              if (_userSessionUsername == null) {
                uniListItem.innerHTML = ` <span class="item-text">${uniName}</span>
                <span class="item-text">${uniDomainLinks}</span>`;
              }

              //if user is authenticated (logged in), add save button next to list items
              else if (_userSessionUsername != null) {
                uniListItem.innerHTML = `
                  <span class="item-text">${uniName}</span>
                  <span class="item-text">${uniCountry}</span>
                  <span class="item-text">${uniDomainLinks}</span>
                  <button class = "item-btn" onclick="saveUniToDb(event, '${uniID}', '${uniName}', '${uniWebsite}', '${uniCountry}', '${sessionStorage.getItem(
                  "sessionStorageUserID"
                )}')">Save</button>
                `;
              }

              //append the result list item to search list container
              searchListContainer.appendChild(uniListItem);

              //update the user of the search status
              document.getElementById(
                "searchStatus"
              ).textContent = `Search complete: ${searchResultCounter}  result(s)`;
            }
            //end of adapted code
          }
        }
      });
  } catch (error) {
    console.log(error);

    //update the user of the search status
    document.getElementById("searchStatus").textContent = "";
  }
}

function logout() {
  //clear sessions for previously logged in user
  sessionStorage.clear();

  //navigate to landing page
  window.open("index.html", "_self");
}

function landing() {
  //navigate to landing page
  window.open("index.html", "_self");
}

//saves user's preferred university item to the db
function saveUniToDb(event, uniId, uniName, uniLink, country, userId) {
  event.preventDefault(); // stop the default form submission

  //define data to include in the body of the POST method
  //code adapted from (Kantor, n.d.-b)
  const postData = new FormData();
  postData.append("action", "saveUni");
  postData.append("uniName", uniName);
  postData.append("uniWebsite", uniLink);
  postData.append("userID", userId);
  //end of adapted code

  //handle errors using the try..catch block
  //code adapted from (Kantor, n.d.)
  try {
    // fetch from the server
    //code adapted from (W3Schools.com, n.d.-c)
    fetch(server, {
      method: "POST",
      body: postData,
    })
      .then((response) => response.json())
      .then((data) => {
        //based on the response from php, we notify the user of the university save status
        if (data.messageCode == "10") {
          alert(data.message);
        } else if (data.messageCode == "11") {
          refreshUserUniqueList();
        } else {
          console.log(data);
        }
      });
  } catch (error) {
    console.log(error);
  }
}

//refresh user's unique list when the save or delete button is cclicked
function refreshUserUniqueList() {
  //to referesh the user's list we need their database user id
  var _userID = sessionStorage.getItem("sessionStorageUserID");

  //get the id of the html user list container
  const userListContainer = document.getElementById("userList");
  userListContainer.innerHTML = ""; //clear user list

  //define data to include in the body of the POST method
  //code adapted from (Kantor, n.d.-b)
  const postData = new FormData();
  postData.append("action", "refreshUserList");
  postData.append("userID", _userID);
  //end of adapted code

  //handle errors using the try..catch block
  //code adapted from (Kantor, n.d.)
  try {
    // fetch from the server
    //code adapted from (W3Schools.com, n.d.-c)
    fetch(server, {
      method: "POST",
      body: postData,
    })
      .then((response) => response.json())
      .then((data) => {
        //handle data depending on response from php

        //if query failed with error
        if (data.status == "error") {
          alert(data.message);
        }
        //if query ran successfully
        else if (data.status == "success") {
          var queryResultsArr = data.queryData;

          //loop through each item in user's list and disaply on the page
          for (count = 0; count < queryResultsArr.length; count++) {
            var uniID = queryResultsArr[count].uni_id;
            var uniName = queryResultsArr[count].name;
            var uniLink = queryResultsArr[count].website;

            //Note: some universities have multiple domains as a single string therefore need to be splitted to create hyperlink
            const linksArr = uniLink.split(","); //split the links into an array

            //create hyperlink from each item in array
            //code adapted from (Malik, 2023)
            let uniDomainLinks = linksArr
              .map((domain) => {
                return `<a href="http://www.${domain}" target="_blank">${domain}</a>`;
              })
              .join(", ");

            //create a user list item to be added to the user list container
            const userListItem = document.createElement("li");

            userListItem.innerHTML = `<span class="item-text">${uniName}</span>
            <span class="item-text">${uniDomainLinks}</span>
            <button class="item-btn" onclick="delSavedUni(event, '${_userID}', '${uniID}')">Remove</button>
            `;

            //append the result list item to search list container
            userListContainer.appendChild(userListItem);

            //end of adapted code
          }
        }
      });
  } catch (error) {
    console.log(error);
  }
  //end of adapted code
}

//delete uni item from user's personalised list
function delSavedUni(event, userID, uniID) {
  event.preventDefault(); // stop the default form submission

  //define data to include in the body of the POST method
  //code adapted from (Kantor, n.d.-b)
  const postData = new FormData();
  postData.append("action", "delUserSavedUni");
  postData.append("userID", userID);
  postData.append("uniID", uniID);
  //end of adapted code

  //handle errors using the try..catch block
  //code adapted from (Kantor, n.d.)
  try {
    // fetch from the server
    //code adapted from (W3Schools.com, n.d.-c)
    fetch(server, {
      method: "POST",
      body: postData,
    })
      .then((response) => response.json())
      .then((data) => {
        //handle data depeneding on response from php

        if (data.status == "error") {
          //if error trying to delete uni from list
          alert(data.message);
        }

        //if delete is succesffull
        else if (data.status == "success") {
          refreshUserUniqueList();
        }
      });
  } catch (error) {
    console.log(error);
  }
  //end of adapted code
}

//this function checks if the browswer supports the crypto api
//code from (Webbjocke, 2018)
function checkBrowserSupportForCypto() {
  console.log("Checking browswer support for crypto api: ");
  console.log(window.crypto && crypto.subtle && window.TextEncoder);
}
//end of adapted code

// Use CryptoAPI (SHA-256) to hash password
//code from (Webbjocke, 2018)
async function hashPassword(password) {
  const encoder = new TextEncoder(); //convert the text to bytes
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data); //hash the password
  const hashArray = Array.from(new Uint8Array(hashBuffer)); //convert the buffer to an array of bytes

  // Convert hash to a readable hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}
//end of adapted code
