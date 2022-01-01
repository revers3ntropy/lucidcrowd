<?php
require '../../main.php';

header('Access-Control-Allow-Origin: *');

$account = query("");

$row = mysqli_fetch_assoc($account);

echo json_encode($row);