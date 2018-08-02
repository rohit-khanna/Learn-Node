/**
 * We are making back to back AJAX requests to an endpoint to fetch the data
 * Here we assigned the data received from Yield to the next call.
 *
 * OUTPUT: List of Repo-names of the input GitHub username
 */
require("isomorphic-fetch");

function callAPI(endpoint) {
  fetch(endpoint)
    .then(res => res.json()) // converts the response into JSON  (then close the stream)
    .then(data => {
      myGen.next(data); // seding out the received data
    });
}

function* getUserRepos(username) {
  let userData = yield callAPI(`https://api.github.com/users/${username}`); // AJAX: fetches Details of Username
  let repos_List = yield callAPI(userData.repos_url); // AJAX: fetches repositories details
  console.log(repos_List.map(r => r.name));
}

let myGen = getUserRepos("rohit-khanna"); // replace with your username
myGen.next();
