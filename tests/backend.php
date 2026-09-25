<?php
declare(strict_types=1);
require dirname(__DIR__) . '/lwca/common.php';
$checks = 0;
function check(bool $value, string $label): void { global $checks; $checks++; if (!$value) throw new RuntimeException($label); }
function invalid(array $data, array $config, string $label): void {
    try { cc_validate($data,$config,false); } catch (InvalidArgumentException $e) { check(true,$label); return; }
    check(false,$label);
}
$config = ['revision'=>'2'];
$data = ['revision'=>'2','language'=>'fr-CA','action'=>'accept_all','categories'=>['necessary'=>true,'analytics'=>true,'marketing'=>true],'gpc'=>false];
check(cc_validate($data,$config,false)['categories']['marketing'], 'normal acceptance');
check(!cc_validate($data,$config,true)['categories']['marketing'], 'HTTP GPC overrides acceptance');
$copy=$data; $copy['gpc']=true;
check(!cc_validate($copy,$config,false)['categories']['marketing'], 'JS GPC overrides acceptance');
foreach (['reject_all','withdraw'] as $action) {
    $copy=$data; $copy['action']=$action; $result=cc_validate($copy,$config,false);
    check(!$result['categories']['analytics'] && !$result['categories']['marketing'], $action.' denies optional');
}
$copy=$data; $copy['action']='save_preferences'; $copy['categories']['analytics']=false;
check(!cc_validate($copy,$config,false)['categories']['analytics'], 'granular choices preserved');
foreach ([['revision','1'],['language','<script>'],['action','accepted'],['gpc','false']] as [$key,$value]) { $copy=$data; $copy[$key]=$value; invalid($copy,$config,'reject invalid '.$key); }
$copy=$data; $copy['categories']['marketing']='false'; invalid($copy,$config,'reject coerced bool');
$copy=$data; $copy['categories']['necessary']=false; invalid($copy,$config,'necessary is fixed');
$copy=$data; $copy['categories']['unknown']=true; invalid($copy,$config,'reject unknown category');
$uuid=cc_uuid(); check((bool)preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/D',$uuid),'UUID format'); check($uuid!==cc_uuid(),'independent random receipts');
$_SESSION=['csrf'=>str_repeat('a',64)]; check(cc_csrf(str_repeat('a',64)),'valid CSRF'); check(!cc_csrf(str_repeat('b',64)),'invalid CSRF'); check(!cc_csrf([]),'array CSRF');
$_SERVER['HTTP_ORIGIN']='https://example.com.evil.test'; check(!cc_same_origin(['origin'=>'https://example.com']),'origin suffix attack');
$_SERVER['HTTP_ORIGIN']='https://example.com'; check(cc_same_origin(['origin'=>'https://example.com']),'exact origin');
unset($_SERVER['HTTP_ORIGIN']); $_SERVER['HTTP_REFERER']='https://example.com/settings'; check(cc_same_origin(['origin'=>'https://example.com']),'referer fallback');
$_SERVER['HTTP_REFERER']=''; check(!cc_same_origin(['origin'=>'https://example.com']),'no origin fails closed');
putenv('CC_ORIGIN=http://example.com'); putenv('CC_ALLOW_LOCAL_HTTP=1');
try { cc_config(); check(false,'insecure production rejected'); } catch (RuntimeException $e) { check(true,'insecure production rejected'); }
putenv('CC_ORIGIN=http://127.0.0.1:8080'); check(!cc_config()['secure'],'explicit loopback development');
putenv('CC_ORIGIN=https://example.com'); check(cc_config()['secure'],'production secure cookie');
echo "Backend unit checks: {$checks} passed\n";
