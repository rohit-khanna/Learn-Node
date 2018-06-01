

exports.responseModel =
    function (error, data, forceLogout) {
        this.error = error;
        this.forceLogout = forceLogout;
        if (data) this.data = data;
        else
            this.data = [];
    };

exports.authenticationResultModel = function (error, token, userID, data) {
    this.error = error;
    this.token = token; // some token
    this.userID = userID;
    this.data = data;
}