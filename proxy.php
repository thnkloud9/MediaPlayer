<?php
    //$url = urldecode($_GET['url']);
    $url = $_GET['url'];
    $ch = curl_init($url);

    curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, true );
    //curl_setopt( $ch, CURLOPT_HEADER, true );
    curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
    curl_setopt( $ch, CURLOPT_USERAGENT, $_GET['user_agent'] ? $_GET['user_agent'] : $_SERVER['HTTP_USER_AGENT']);

    $results = curl_exec($ch);

    echo $results; 
?>
