// Treechat
"use strict";
// globals: document, window

var DH = window.DH || {};

DH.treechat = function (aServer, aElementOrId, aRootId, aRenderCallback) {
    var self = {},
        element = typeof aElementOrId === 'string' ? document.getElementById(aElementOrId) : aElementOrId;
    element.classList.add('treechat');

    self.onClick = function (aId, aDetail) {
        // Click on item
        console.log('DH.treechat.onClick', aId, aDetail);
    };

    self.onPost = function (aNewId, aDetail, aRootId) {
        // Called after post
        console.log('DH.treechat.onPost', aNewId, aDetail, aRootId);
    };

    self.renderComment = function (aParent, aId, aTime, aMessage, aReplies, aNew) {
        // Render single comment
        var li, header, id, time, message, replies, clearfix;

        // comment
        li = document.createElement('li');
        self.lastLi = li;
        li.addEventListener('click', function () {
            self.onClick(aId,
                {
                    id: aId,
                    time: aTime,
                    message: aMessage,
                    replies: aReplies,
                    newReplies: aNew,
                    elements: {
                        li: li,
                        header: header,
                        id: id,
                        time: time,
                        message: message,
                        replies: replies
                    }
                });
        });

        // header
        header = document.createElement('div');
        header.className = 'header';
        li.appendChild(header);

        // id
        id = document.createElement('div');
        id.className = 'id';
        id.textContent = '#' + aId;
        header.appendChild(id);

        // time
        time = document.createElement('div');
        time.className = 'time';
        time.textContent = DH.date.human(aTime);
        time.style.marginLeft = '1ex';
        time.style.float = 'right';
        header.appendChild(time);

        // replies
        replies = document.createElement('div');
        replies.className = 'replies';
        if (aNew > 0) {
            replies.classList.add('new');
        }
        replies.textContent = aReplies; // > 1 ? aReplies + '💬' : aReplies > 0 ? '💬' : '';
        //replies.textContent = 'read ' + aReplies + ' replies';
        if (aReplies > 0) {
            li.appendChild(replies);
        }

        // message
        message = document.createElement('div');
        message.className = 'message';
        message.textContent = aMessage;
        li.appendChild(message);

        // clearfix
        clearfix = document.createElement('div');
        clearfix.style.clear = 'both';
        //li.appendChild(clearfix);

        aParent.appendChild(li);
        return li;
    };

    self.renderReplyBox = function (aParent) {
        // Render box for reply
        var li, textarea, post, remaining;
        li = document.createElement('li');
        li.className = 'indent';
        aParent.appendChild(li);

        textarea = document.createElement('textarea');
        textarea.className = 'reply';
        textarea.placeholder = 'Type reply here';
        textarea.maxLength = 5000;
        // workaround for textarea under keyboard
        textarea.addEventListener('focus', function () {
            textarea.scrollIntoView();
            console.log('scroll to textarea');
            setTimeout(function () {
                console.log('scroll to textarea after 1000ms');
                textarea.scrollIntoView();
            }, 1000);
        });
        li.appendChild(textarea);

        post = document.createElement('button');
        post.className = 'post';
        post.textContent = 'Post';
        post.addEventListener('click', function () {
            if (textarea.value.trim() === '') {
                textarea.focus();
                return;
            }
            DH.json(aServer, {parent: aRootId, message: textarea.value}, function (aOk, aData) {
                if (!aOk || (aData.code <= 0)) {
                    alert(aData.message);
                    return;
                }
                self.render(aRootId);
                // focus last li
                if (self.lastLi) {
                    console.log('scroll to lastLi');
                    self.lastLi.scrollIntoView();
                    setTimeout(function () {
                        console.log('scroll to lastLi after 1000ms');
                        self.lastLi.scrollIntoView();
                    }, 1000);
                } else {
                    console.log('scroll to postTextarea');
                    self.postTextarea.scrollIntoView();
                    setTimeout(function () {
                        console.log('scroll to postTextarea after 1000ms');
                        self.postTextarea.scrollIntoView();
                    }, 1000);
                }
                self.onPost(aData.extra.new_id, aData.detail, aRootId);
            });
        });
        li.appendChild(post);

        remaining = document.createElement('span');
        remaining.className = 'remaining';
        remaining.textContent = '5000 chars remaining';
        textarea.addEventListener('input', function () {
            remaining.textContent = (5000 - textarea.value.length) + ' chars remaining';
        });
        li.appendChild(remaining);

        self.postLi = li;
        self.postTextarea = textarea;
        self.postRemaining = remaining;
        self.postButton = post;
    };

    self.render = function (aCommentId) {
        // Render comment tree
        var oldest = DH.storage.readObject('DH_TREECHAT_OLDEST_' + aServer, {});
        DH.json(aServer, {parent: aCommentId}, function (aOk, aData) {
            if (!aOk) {
                alert(aData);
                return;
            }
            console.log('data', aData);
            var i, li, max = 0;
            element.textContent = '';
            for (i = 0; i < aData.detail.length; i++) {
                li = self.renderComment(
                    element,
                    aData.detail[i].id,
                    aData.detail[i].posted,
                    aData.detail[i].message,
                    aData.detail[i].replies,
                    (aData.detail[i].replies > 0 && !oldest.hasOwnProperty(aData.detail[i].id))
                        || (aData.detail[i].oldest > oldest[aData.detail[i].id])
                );
                if (i > 0) {
                    li.classList.add('indent');
                }
                if (aData.detail[i].oldest > max) {
                    max = aData.detail[i].oldest;
                }
            }
            // reply box
            self.renderReplyBox(element);
            // done rendering
            if (aRenderCallback) {
                aRenderCallback(self);
            }
            // don't grow oldest indefinetely
            if (Object.keys(oldest) > 1000) {
                oldest = {};
            }
            // remember oldest
            oldest[aCommentId] = max;
            DH.storage.writeObject('DH_TREECHAT_OLDEST_' + aServer, oldest);
        });

    };
    self.render(aRootId);

    return self;
};
