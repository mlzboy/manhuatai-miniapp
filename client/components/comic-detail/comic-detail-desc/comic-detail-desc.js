const cache = require('../../../utils/cache');
const apiBookshelf = require('../../../api/bookshelf');

Component({
  data: {
    readComic: {},
    collected: false,
    userInfo: {},
  },
  properties: {
    comicId: {
      type: Number,
      value: 0,
    },
    influenceData: {
      type: Object,
      value: {},
    },
    commentCount: {
      type: Number,
      value: 0,
    },
    comicInfoBody: {
      type: Object,
      value: {},
    },
  },
  ready: function() {
    this.getLocalStorage();
  },
  pageLifetimes: {
    show: function() {
      this.getLocalStorage();
    },
  },
  methods: {
    goToChapterRead: function() {
      const comicId = this.properties.comicId;
      const comicInfoBody = this.properties.comicInfoBody;
      const comicChapter = comicInfoBody.comic_chapter;

      if (!comicChapter) {
        return;
      }

      const chapter_topic_id = this.data.readComic.chapter_topic_id
        ? this.data.readComic.chapter_topic_id
        : comicChapter[comicChapter.length - 1].chapter_topic_id;
      const url = `/pages/comic-chapter-read/comic-chapter-read?comic_id=${comicId}&comic_name=${
        comicInfoBody.comic_name
      }&chapter_topic_id=${chapter_topic_id}`;

      wx.navigateTo({
        url,
      });
    },
    // 收藏漫画
    collectComic: function() {
      const comicInfoBody = this.properties.comicInfoBody;
      if (!comicInfoBody.comic_name) {
        return;
      }

      const collections = cache.loadCollections() || [];
      const comic = collections.find((item) => {
        return item.comic_id === this.data.comicId;
      });

      if (comic) {
        wx.showToast({
          title: '您已收藏过这个漫画了哦',
          icon: 'none',
        });
      } else {
        const userInfo = this.data.userInfo;

        // 用户登录后，同步到线上
        if (userInfo.Uname) {
          wx.showLoading({
            title: '加入中，请稍候...',
            mask: true,
          });

          const requestData = {
            type: 'mkxq',
            openid: userInfo.openid,
            myuid: userInfo.Uid,
            comic_id: this.data.comicId,
            action: 'add',
          };

          apiBookshelf.setUserCollect(requestData, (res) => {
            this.saveComic();
            wx.hideLoading();
          });
        } else {
          this.saveComic();
        }
      }
    },
    saveComic: function() {
      const comicInfoBody = this.properties.comicInfoBody;
      const img_url = 'https://image.samanlehua.com/mh/{0}.jpg-480x640.jpg';
      const comicData = {
        comic_id: this.data.comicId,
        comic_name: comicInfoBody.comic_name,
        last_chapter_name: comicInfoBody.last_chapter_name,
        update_time: comicInfoBody.update_time,
        comic_img: img_url.replace('{0}', this.data.comicId),
      };
      cache.saveComic(comicData);

      wx.showToast({
        title: '收藏成功!',
        icon: 'success',
      });
      this.setData({
        collected: true,
      });
    },
    // 读取本地缓存数据
    getLocalStorage: function() {
      const historyReads = cache.loadHistoryRead() || [];
      const collections = cache.loadCollections() || [];
      const userInfo = cache.loadUserInfo() || {};

      this.setData({
        userInfo,
      });

      // 查找当前漫画是否在本地缓存中
      const comic = historyReads.find((item) => {
        return item.comic_id === this.properties.comicId;
      });

      if (comic) {
        this.setData({
          readComic: comic,
        });
      }

      // 在本地缓存中 查找当前漫画是否已经被收藏过了
      const collectionComic = collections.find((item) => {
        return item.comic_id === this.data.comicId;
      });

      if (collectionComic) {
        this.setData({
          collected: true,
        });
      }
    },
  },
});
