<?php

require_once(APPLICATION_PATH . "src/library/Cache/Manager.php");

class ExternalDataBase {

    /**
     * Guzzle Http Client
    */
    protected $httpClient;
    protected $cacheManager;

    public function __construct()
    {
        $this->cacheManager = new CacheManager();
        $this->httpClient = new GuzzleHttp\Client();
    }

    protected function retrieveCache($key, $cacheTime = null)
    {
        return $this->cacheManager->retrieve($key, $cacheTime);
    }

    protected function storeCache($key, $data)
    {
        $this->cacheManager->store($key, $data);
    }
}
