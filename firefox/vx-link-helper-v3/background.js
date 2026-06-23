
function convert(url){
 try{
   const u = new URL(url);
   u.hash = "";

   // 通用追踪参数黑名单 (X / Reddit / Pixiv 等所有站点)
   // 注意: t 不在此列 — B 站的 t 是视频跳转时间(有用), 由白名单处理
   [
     "spm_id_from", "from_spmid", "vd_source", "share_source",
     "share_medium", "share_plat", "share_session_id", "share_tag",
     "unique_k", "timestamp", "bbid", "s", "mx", "ref_src",
     // B 站 / 通用追踪参数补全
     "buvid", "buvid_from", "is_story_h5", "spmid", "spmid_from",
     "share_spmid", "from", "fromsource", "seid", "plat_id", "ts",
     "track_id", "signCoverage", "msource", "bsource", "ssource",
     "mao2_medium", "mao2_source", "cover_shid", "shid", "refer_url",
     "share_id", "share_medium_id", "share_plat_id", "share_channel",
     "share_token", "share_origin", "share_session", "attach", "fr",
     "extension", "argv", "auto_play", "preview_template", "forward",
     "intro", "network", "platform", "wifiAutoPlay", "screenName", "nm",
     "goto", "mobile_pkg", "camp_id", "vc_name", "vc_source", "csource",
     "ha_source", "ha_method", "from_spmid_from", "share_source_mutation",
     "session_id", "share_tag_id", "promotion_id", "ttk_id",
     "union_source", "branch_pid", "webid"
   ].forEach(p => u.searchParams.delete(p));

   const h = u.hostname.replace(/^www\./, '');
   let isBili = false;

   if(h === "x.com" || h === "twitter.com") u.hostname = "vxtwitter.com";
   else if(h === "reddit.com") u.hostname = "rxddit.com";
   else if(h === "pixiv.net") u.hostname = "phixiv.net";
   else if(h === "bilibili.com" || h === "b23.tv") {
     u.hostname = "vxbilibili.com";
     isBili = true;
   }

   // B 站追踪参数种类极多且持续新增, 黑名单无法覆盖.
   // 改用白名单: 仅保留对内容定位真正必要的参数, 其余一律删除.
   if(isBili){
     const biliAllowed = new Set([
       "p",          // 分 P 编号
       "t",          // 视频跳转时间(秒)
       "ep_id",      // 番剧分集 ID
       "season_id",  // 番剧合集 ID
       "ssid",       // season_id 别名
       "cid",        // 视频 cid
       "aid",        // avid
       "bvid"        // bvid (通常在 path 中, 但偶尔作为参数出现)
     ]);
     [...u.searchParams.keys()].forEach(k => {
       if(!biliAllowed.has(k)) u.searchParams.delete(k);
     });
   }

   return u.toString();
 }catch(e){return url;}
}

browser.contextMenus.create({
 id:"copy-vx-link",
 title:"复制 VX 链接",
 contexts:["link"]
});

browser.contextMenus.onClicked.addListener(async(info)=>{
 if(info.menuItemId==="copy-vx-link"){
   await navigator.clipboard.writeText(convert(info.linkUrl));
 }
});
