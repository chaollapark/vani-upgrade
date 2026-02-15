<?php

/**
 * Permission keys given to users in each group.
 * All users are implicitly in the '*' group including anonymous visitors;
 * logged-in users are all implicitly in the 'user' group. These will be
 * combined with the permissions of all groups that a given user is listed
 * in in the user_groups table.
 */
$wgGroupPermissions = array();

// Implicit group for all visitors
$wgGroupPermissions['*'    ]['createaccount']   = false;
$wgGroupPermissions['*'    ]['read']            = true;
$wgGroupPermissions['*'    ]['edit']            = false;
$wgGroupPermissions['*'    ]['createpage']      = false;
$wgGroupPermissions['*'    ]['createtalk']      = false;
$wgGroupPermissions['*']['editmyprivateinfo'] = true;

// To edit preferences of logged in users
$wgGroupPermissions['user']['editmyusercss']                = true;
$wgGroupPermissions['user']['editmyuserjs']                 = true;
$wgGroupPermissions['user']['viewmywatchlist']              = true;
$wgGroupPermissions['user']['editmywatchlist']              = true;
$wgGroupPermissions['user']['viewmyprivateinfo']            = true;
$wgGroupPermissions['user']['editmyprivateinfo']            = true;
$wgGroupPermissions['user']['editmyoptions']                = true;

// Implicit group for all logged-in accounts
$wgGroupPermissions['user' ]['move']            = false;
$wgGroupPermissions['user' ]['read']            = true;
$wgGroupPermissions['user' ]['edit']            = false;
$wgGroupPermissions['user' ]['createpage']      = false;
$wgGroupPermissions['user' ]['createtalk']      = false;
$wgGroupPermissions['user' ]['upload']          = false;
$wgGroupPermissions['user' ]['reupload']        = false;
$wgGroupPermissions['user' ]['reupload-shared'] = false;
$wgGroupPermissions['user' ]['minoredit']       = false;

// Implicit group for editors
$wgGroupPermissions['Editor']['move']            = true;
$wgGroupPermissions['Editor']['read']            = true;
$wgGroupPermissions['Editor']['edit']            = true;
$wgGroupPermissions['Editor']['createpage']      = true;
$wgGroupPermissions['Editor']['createtalk']      = true;
$wgGroupPermissions['Editor']['delete']          = true;
$wgGroupPermissions['Editor']['upload']          = true;
$wgGroupPermissions['Editor']['reupload']        = true;
$wgGroupPermissions['Editor']['reupload-shared'] = true;
$wgGroupPermissions['Editor']['minoredit']       = true;
$wgGroupPermissions['Editor']['passwordreset'] = true;

// Implicit group for accounts that pass $wgAutoConfirmAge
$wgGroupPermissions['autoconfirmed']['autoconfirmed'] = true;

// Implicit group for accounts with confirmed email addresses
$wgGroupPermissions['emailconfirmed']['emailconfirmed'] = true;

// Users with bot privilege can have their edits hidden
$wgGroupPermissions['bot'  ]['bot']             = true;
$wgGroupPermissions['bot'  ]['autoconfirmed']   = true;
$wgGroupPermissions['bot'  ]['nominornewtalk']  = true;
$wgGroupPermissions['bot'  ]['writeapi']  = true;

// Most extra permission abilities go to this group
$wgGroupPermissions['sysop']['move']            = true;
$wgGroupPermissions['sysop']['read']            = true;
$wgGroupPermissions['sysop']['edit']            = true;
$wgGroupPermissions['sysop']['createpage']      = true;
$wgGroupPermissions['sysop']['createtalk']      = true;
$wgGroupPermissions['sysop']['upload']          = true;
$wgGroupPermissions['sysop']['reupload']        = true;
$wgGroupPermissions['sysop']['reupload-shared'] = true;
$wgGroupPermissions['sysop']['minoredit']       = true;
$wgGroupPermissions['sysop']['block']           = true;
$wgGroupPermissions['sysop']['createaccount']   = true;
$wgGroupPermissions['sysop']['delete']          = true;
$wgGroupPermissions['sysop']['deletedhistory']  = true;
$wgGroupPermissions['sysop']['editinterface']   = true;
$wgGroupPermissions['sysop']['import']          = true;
$wgGroupPermissions['sysop']['importupload']    = true;
$wgGroupPermissions['sysop']['patrol']          = true;
$wgGroupPermissions['sysop']['autopatrol']      = true;
$wgGroupPermissions['sysop']['protect']         = true;
$wgGroupPermissions['sysop']['proxyunbannable'] = true;
$wgGroupPermissions['sysop']['rollback']        = true;
$wgGroupPermissions['sysop']['trackback']       = true;
$wgGroupPermissions['sysop']['upload']          = true;
$wgGroupPermissions['sysop']['reupload']        = true;
$wgGroupPermissions['sysop']['reupload-shared'] = true;
$wgGroupPermissions['sysop']['unwatchedpages']  = true;
$wgGroupPermissions['sysop']['autoconfirmed']   = true;
$wgGroupPermissions['sysop']['upload_by_url']   = true;
$wgGroupPermissions['sysop']['ipblock-exempt']  = true;
$wgGroupPermissions['sysop']['userrights']      = true;
$wgGroupPermissions['sysop']['editprotected'] = true;
$wgGroupPermissions['sysop']['deleterevision'] = true;
$wgGroupPermissions['sysop']['deletelogentry'] = true;
$wgGroupPermissions['sysop']['deletedhistory'] = true;
$wgGroupPermissions['sysop']['undelete'] = true;
$wgGroupPermissions['sysop']['editaccount'] = true;

$wgGroupPermissions['bureaucrat']['editaccount'] = true;

$wgGroupPermissions['*']    ['interwiki']   = false;
$wgGroupPermissions['sysop']['interwiki']   = true;
