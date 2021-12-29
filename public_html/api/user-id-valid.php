<?php
require '../../main.php';
header('Access-Control-Allow-Origin: *');

$row = mysqli_fetch_assoc(query("SELECT * FROM users WHERE id=".$_GET['id']));

echo count($row) ? '1' : '0';