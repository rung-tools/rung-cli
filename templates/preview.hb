<!DOCTYPE html>
<html>
    <head>
        <title>Rung CLI Preview</title>
        <meta charset="utf-8">
        <meta name="viewport" content="initial-scale=1, maximum-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Roboto:300" rel="stylesheet">
    </head>
    <style>
    body {
        background-color: #BBBBBB;
        padding: 0;
        margin: 0;
        background-image: url(./wallpaper.jpg);
        background-position: center center;
    }

    #rung-bar {
        width: 100%;
        height: 64px;
        background-color: rgb(63, 81, 181);
    }

    #rung-alerts {
        margin: 40px;
    }

    .custom-scrollbar::-webkit-scrollbar, textarea::-webkit-scrollbar {
        width: 8px;
        -webkit-appearance: none;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb, textarea::-webkit-scrollbar-thumb {
        background: rgba(200, 200, 200, 0.7);
        min-height: 36px;
        cursor: pointer;
        color: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover, textarea::-webkit-scrollbar-thumb:hover {
        background: rgba(34, 167, 250, 0.7);
    }

    .card {
        position: relative;
        width: 145px;
        height: 115px;
        display: inline-block;
        margin: 2px;
        border: 1px solid silver;
        padding: 0 10px;
        padding-top: 10px;
        overflow-x: hidden;
        overflow-y: auto;
        text-align: center;
        font-family: Roboto, sans-serif;
    }

    #user-placeholder {
        float: right;
    }

    #logo {
        margin-left: 24px;
        height: 64px;
    }

    #fake-avatar {
        position: absolute;
        top: 13px;
        right: 200px;
        height: 40px;
        width: 40px;
        border-radius: 42px;
        background-color: #CCCCCC;
    }

    .fake-line {
        background-color: #CCCCCC;
        height: 13px;
    }

    #fake-line-1 {
        position: absolute;
        top: 18px;
        right: 25px;
        width: 160px;
    }

    #fake-line-2 {
        position: absolute;
        top: 35px;
        right: 65px;
        width: 120px;
    }
    </style>
    <body>
        <div id="rung-bar">
            <img src="./rung-logo.png" draggable="false" id="logo" />
            <div id="fake-avatar"></div>
            <div id="fake-line-1" class="fake-line"></div>
            <div id="fake-line-2" class="fake-line"></div>
        </div>
        <div id="rung-alerts">
            {{#each alerts}}
                <div class="card custom-scrollbar" title="{{title}}">
                    {{{content}}}
                </div>
            {{/each}}
        </div>
    </body>
</html>
