<?php

require_once("Base.php");

class InstagramData extends ExternalDataBase {

    private $clientId;
    private $clientSecret;

    public function __construct($clientId, $clientSecret)
    {
        $this->clientId = $clientId;
        $this->clientSecret = $clientSecret;
        parent::__construct();
    }

    /**
     * @param $host server host
     *
     * @return string redirect url
     */
    public function getAuthRedirectUri($redirect_uri)
    {
        return "https://api.instagram.com/oauth/authorize/?client_id=".
        $this->clientId.
        "&redirect_uri=".
        $redirect_uri."&response_type=code";

    }


    /**
     * @param $code the code from the Instagram redirect in the GET params
     *
     * @return stdClass() JSON response
     */
    public function getAuthTokenFromCode($redirect_uri, $code)
    {

        $response = $this->httpClient->post(
            "https://api.instagram.com/oauth/access_token", [
                'form_params' => [
                    'client_id' => $this->clientId,
                    'client_secret' => $this->clientSecret,
                    'grant_type' => 'authorization_code',
                    'redirect_uri' => $redirect_uri,
                    'code' => $code
                ]
            ]
        );
        $body = $response->getBody();
        $data = json_decode($body);
        $this->storeCache("instagramUser", $data);
        return $data;
    }

    /**
     *
     * @return array() a collection of media objects decoded from the youtube api response
     */
    public function getEmbedMedia($shortcodes, $maxwidth = 525)
    {
        $cacheKey = md5("instagramShortcodes:" . implode("|", $shortcodes) . $maxwidth);
        $cache = $this->retrieveCache($cacheKey);

        if(!$cache) {
            foreach ($shortcodes as $id) {
                $response = $this->httpClient->get( 'http://api.instagram.com/publicapi/oembed/?url=' . $id . '&maxwidth=' .$maxwidth )->send();
                $response = json_decode($response->getBody(true));
                $data[] = $response;
            }
            $this->storeCache($cacheKey, $data);
            return $data;
        } else {
            return $cache;
        }
    }

    /**
     *
     * @param  $count Instagram user id
     * @return array() a collection of recent instagram posts by user id
     */
    public function getRecentMedia($count = 6, $tags = array(), $cacheTime = 3600)
    {
        $instagramUser = $this->retrieveCache("instagramUser");
        $cacheKey = md5("instagramRecent:".$instagramUser->user->id.$count,implode(",", $tags));
        // $cache = $this->retrieveCache($cacheKey, $cacheTime);
        $cache = false;
        if(!$cache) {

            $data = array();
            $url = null;
            while (count($data) < $count) {

                if(is_null($url)) {
                    $url = "https://api.instagram.com/v1/users/self/media/recent/?access_token=".$instagramUser->access_token."&count=".$count;

                                    // echo $url; exit();
                }
                $response = $this->httpClient->get( $url );
                $response = $response->getBody();
                $response = json_decode($response);

                foreach($response->data as $d) {
                    if(count($data) < $count) {
                        $add = false;
                        foreach ($tags as $tag) {
                            if(count($tags) > 0) {
                                if(in_array($tag, $d->tags)) {
                                    $data[] = $d;
                                    break;
                                }
                            } else {
                                $data[] = $d;
                            }
                        }
                    } else {
                        break;
                    }
                }

                $url = "https://api.instagram.com/v1/users/self/media/recent/?access_token=".$instagramUser->access_token."&count=".$count."&min_id=".$d->id;

                // echo $url; exit();
            }

            $this->storeCache($cacheKey, $data);
        } else {
            $data = $cache;
        }

        return $data;

    }
}
