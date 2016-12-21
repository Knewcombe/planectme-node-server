module.exports = {
	'AUTH_LOGIN' : 'SELECT * FROM user_profile',
	'AUTH_SIGN_UP' : 'SELECT user_email FROM user_account WHERE user_email = user.email'
}
