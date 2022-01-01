<?php
// shows errors
ini_set('display_errors', true);
error_reporting(E_ALL);


// src: https://dev.to/fadymr/php-create-your-own-php-dotenv-3k2i
function loadENV($path){
	if (!file_exists($path)) {
		throw new \InvalidArgumentException(sprintf('%s does not exist', $path));
	}
	
	if (!is_readable($path)) {
		throw new \RuntimeException(sprintf('%s file is not readable', $path));
	}

	$lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
	foreach ($lines as $line) {

		if (strpos(trim($line), '#') === 0) {
			continue;
		}

		list($name, $value) = explode('=', $line, 2);
		$name = trim($name);
		$value = trim($value);

		if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
			putenv(sprintf('%s=%s', $name, $value));
			$_ENV[$name] = $value;
			$_SERVER[$name] = $value;
		}
	}
}

loadENV('/home/lucid/.env');

$connection = mysqli_connect(
    'localhost',
    getenv("DB_USER"),
    getenv("DB_PASSWORD"),
    getenv("DB_DATABASE")
)
    or die('Failed to connect to SQL server');

// query the database passed in
function query ($query) {
    global $connection;
    return mysqli_query($connection, $query);
}

function sigmoid ($x) {
	return 1 / exp(-$x);
}

// common utils
function reputation ($id, $a, $b, $c, $d) {
	$res = query('
        SELECT labels.*, 
               datapoint.id as pointid, 
               datasets.id as datasetid
        FROM labels 
        WHERE
              userid='.$id.',
              AND labels.datumid = datapoints.id
              AND datapoints.dataset = datasets.id
	');
	$labels = mysqli_fetch_assoc($res);

	$accuracy = 0;
	foreach ($labels as &$label) {
		$accuracy += labelAccuracy($label);
	}
	$accuracy /= count($labels);

	return floor($accuracy * (sigmoid(count($labels)) / $a - $b));
}

function labelAccuracy ($label): int {
	return 0;
}