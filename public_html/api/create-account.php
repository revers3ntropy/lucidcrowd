<?php
require '../../main.php';
header('Access-Control-Allow-Origin: *');

$res = mysqli_fetch_assoc(query('
	SELECT 
       FLOOR (1 + RAND() * '.getenv('SEC_IDMAX').') 
           AS i
	FROM users
	HAVING 
       i NOT IN (
           SELECT DISTINCT id FROM users
       ) 
	LIMIT 1
'));

$id = $res['i'];

if (!$id) {
	echo 'bad id generated: '.$id;
} else {
	if (!query("INSERT INTO users VALUES (".$id.", '".$_GET['username']."')")) {
		echo 'error';
	} else {
		echo $id;
	}
}