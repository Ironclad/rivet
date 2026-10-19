bind = "0.0.0.0:" + str(__import__('os').getenv('PORT', 5000))
workers = 2
timeout = 120
accesslog = "-"
errorlog = "-"
loglevel = "info"
