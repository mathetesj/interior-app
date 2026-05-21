// ============================================
// 우리집 인테리어 — Apps Script API v2.2.3 (chunked photo upload)
// GitHub Pages + Apps Script + Spreadsheet/Drive 구조 유지형 안정화 버전
// ============================================

var INTERIOR_CONFIG_206 = {
  APP_VERSION: '2.2.3',
  SHEET_ID: '1rl9c7gPZ6egDOKTmzTPxOYXf0Z1uoYaJJawGVf3v0UE',
  APP_PIN: '1234',
  REQUIRE_PIN: true,
  DRIVE_ROOT_FOLDER: '인테리어앱_이미지',
  DEFAULT_PAGE_SIZE: 40,
  MAX_PAGE_SIZE: 80,
  UPLOAD_TTL_SECONDS: 1800,
  UPLOAD_CHUNK_CHAR_SIZE: 2400,
  MAX_UPLOAD_CHUNKS: 600,
  MAX_BASE64_CHARS: 1200000,
  USERS: ['홍대표', '아내']
};

var INTERIOR_HEADERS_206 = {
  spaces: [
    'space_id', 'name', 'icon', 'order_index', 'is_active', 'created_at', 'updated_at'
  ],
  items: [
    'item_id', 'space_id', 'type', 'content_url', 'thumbnail_url', 'title', 'memo',
    'created_by', 'created_at', 'is_deleted', 'category', 'tags', 'why_good', 'caution',
    'priority', 'brief_status', 'updated_at'
  ],
  reactions: [
    'reaction_id', 'item_id', 'user_name', 'reaction', 'updated_at'
  ],
  comments: [
    'comment_id', 'item_id', 'user_name', 'text', 'created_at'
  ],
  upload_chunks: [
    'upload_id', 'chunk_index', 'chunk', 'created_at'
  ]
};

var INTERIOR_DEFAULT_SPACES_206 = [
  ['sp_living', '거실', '🛋', 1],
  ['sp_kitchen', '주방', '🍳', 2],
  ['sp_bedroom', '침실', '🛏', 3],
  ['sp_bath', '욕실', '🚿', 4],
  ['sp_entry', '현관', '🚪', 5]
];

var INTERIOR_CATEGORY_META_206 = {
  mood: '무드/스타일',
  layout: '구조/동선',
  color: '컬러/마감',
  lighting: '조명',
  furniture: '가구',
  storage: '수납',
  material: '자재',
  question: '업자 질문',
  etc: '기타'
};

var INTERIOR_VALID_TYPES_206 = ['photo', 'link', 'memo'];
var INTERIOR_VALID_REACTIONS_206 = ['love', 'no', 'hold'];
var INTERIOR_VALID_STATUS_206 = ['candidate', 'selected', 'question', 'avoid'];
var INTERIOR_VALID_PRIORITY_206 = ['high', 'medium', 'low'];
var INTERIOR_SS_CACHE_206 = null;

// ── 라우터 ───────────────────────────────────

function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var rawCallback = str_(params.callback);
  var callback = /^[A-Za-z_$][0-9A-Za-z_$.]*$/.test(rawCallback) ? rawCallback : '';

  try {
    var action = str_(params.action || 'getBootstrap');

    // 배포/권한 진단용입니다. 민감 데이터 없이 버전만 반환합니다.
    if (action === 'ping' || action === 'health') {
      return output_(ok_({ version: INTERIOR_CONFIG_206.APP_VERSION, pong: true, now: new Date().toISOString() }), callback);
    }

    assertClientPin_(params);
    var userName = normalizeUserName_(params.user_name);

    var data;
    switch (action) {
      case 'getBootstrap': data = getBootstrapData_(params, userName); break;
      case 'getSpaces':    data = getSpacesData_(); break;
      case 'ensureDefaultSpaces': data = withLock_(function () { return ensureDefaultSpacesData_(); }); break;
      case 'seedDefaultSpaces': data = withLock_(function () { return ensureDefaultSpacesData_(); }); break;
      case 'driveDiagnose': data = driveDiagnoseData_(); break;
      case 'addItem':     data = withLock_(function () { return addItemData_(params, { name: userName, email: userName }); }); break;
      case 'beginPhotoUpload':  data = withLock_(function () { return beginPhotoUploadData_(params, { name: userName, email: userName }); }); break;
      case 'uploadPhotoChunk':  data = uploadPhotoChunkData_(params, { name: userName, email: userName }); break;
      case 'finishPhotoUpload': data = withLock_(function () { return finishPhotoUploadData_(params, { name: userName, email: userName }); }); break;
      case 'cancelPhotoUpload': data = cancelPhotoUploadData_(params, { name: userName, email: userName }); break;
      case 'setReaction': data = withLock_(function () { return setReactionData_(params, { name: userName, email: userName }); }); break;
      case 'updateItem':  data = withLock_(function () { return updateItemData_(params, { name: userName, email: userName }); }); break;
      case 'addComment':  data = withLock_(function () { return addCommentData_(params, { name: userName, email: userName }); }); break;
      case 'saveSpace':   data = withLock_(function () { return saveSpaceData_(params); }); break;
      case 'deleteItem':  data = withLock_(function () { return deleteItemData_(params, { name: userName, email: userName }); }); break;
      case 'diagnose':     data = diagnoseData_(); break;
      case 'getItems':     data = getItemsData_(params); break;
      case 'getReactions': data = getReactionsData_(params, userName); break;
      case 'getFeed':      data = getFeedData_(params, userName); break;
      case 'getComments':  data = getCommentsData_(params); break;
      case 'getSummary':   data = getSummaryData_(); break;
      case 'getBrief':     data = getBriefData_(); break;
      default: throw new Error('unknown action: ' + action);
    }

    return output_(ok_(data), callback);
  } catch (err) {
    return output_(fail_(err), callback);
  }
}

function doPost(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var wantsPostMessage = str_(params.post_message) === '1';
  var targetOrigin = str_(params.target_origin || '*');
  var requestId = str_(params.request_id || '');
  var result;

  try {
    var body = parseBody_(e);
    assertClientPin_(body);
    var action = str_(body.action);
    var user = { name: normalizeUserName_(body.user_name), email: normalizeUserName_(body.user_name) };

    var data;
    switch (action) {
      case 'addItem':     data = withLock_(function () { return addItemData_(body, user); }); break;
      case 'beginPhotoUpload':  data = withLock_(function () { return beginPhotoUploadData_(body, user); }); break;
      case 'uploadPhotoChunk':  data = uploadPhotoChunkData_(body, user); break;
      case 'finishPhotoUpload': data = withLock_(function () { return finishPhotoUploadData_(body, user); }); break;
      case 'cancelPhotoUpload': data = cancelPhotoUploadData_(body, user); break;
      case 'driveDiagnose': data = driveDiagnoseData_(); break;
      case 'setReaction': data = withLock_(function () { return setReactionData_(body, user); }); break;
      case 'updateItem':  data = withLock_(function () { return updateItemData_(body, user); }); break;
      case 'addComment':  data = withLock_(function () { return addCommentData_(body, user); }); break;
      case 'saveSpace':   data = withLock_(function () { return saveSpaceData_(body); }); break;
      case 'ensureDefaultSpaces': data = withLock_(function () { return ensureDefaultSpacesData_(); }); break;
      case 'seedDefaultSpaces': data = withLock_(function () { return ensureDefaultSpacesData_(); }); break;
      case 'deleteItem':  data = withLock_(function () { return deleteItemData_(body, user); }); break;
      default: throw new Error('unknown action: ' + action);
    }

    result = ok_(data);
  } catch (err) {
    result = fail_(err);
  }

  if (wantsPostMessage) return postMessageOutput_(result, targetOrigin, requestId);
  return output_(result);
}

// Apps Script 환경에 따라 OPTIONS가 완전히 동작하지 않을 수 있습니다.
// 프론트에서는 preflight가 생기지 않도록 text/plain POST를 사용합니다.
function doOptions(e) {
  return output_(ok_({}));
}

// ── READ API ─────────────────────────────────

function getBootstrapData_(params, userName) {
  var spaces = getSpacesData_().spaces;
  var feed = getFeedData_({
    space_id: str_(params.space_id || ''),
    page: str_(params.page || '1'),
    page_size: str_(params.page_size || INTERIOR_CONFIG_206.DEFAULT_PAGE_SIZE)
  }, userName);
  var summary = getSummaryData_().summary;

  return {
    spaces: spaces,
    items: feed.items,
    reactions: feed.reactions,
    comment_counts: feed.comment_counts || {},
    total: feed.total,
    page: feed.page,
    has_more: feed.has_more,
    summary: summary
  };
}

function getSpacesData_() {
  ensureAllSheets_();
  seedDefaultSpacesIfNeeded_();

  var table = readTable_('spaces');
  var spaces = table.rows
    .filter(function (row) { return str_(row.space_id) && str_(row.name) && isActive_(row.is_active); })
    .map(function (row) {
      return {
        space_id: str_(row.space_id),
        name: str_(row.name),
        icon: str_(row.icon || '🏠'),
        order_index: number_(row.order_index, 999),
        is_active: true
      };
    })
    .sort(function (a, b) { return a.order_index - b.order_index; });

  if (!spaces.length) {
    spaces = INTERIOR_DEFAULT_SPACES_206.map(function (space) {
      return { space_id: space[0], name: space[1], icon: space[2], order_index: space[3], is_active: true };
    });
  }

  return { spaces: spaces };
}

function getItemsData_(params) {
  var page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  var pageSize = clamp_(parseInt(params.page_size || INTERIOR_CONFIG_206.DEFAULT_PAGE_SIZE, 10) || INTERIOR_CONFIG_206.DEFAULT_PAGE_SIZE, 1, INTERIOR_CONFIG_206.MAX_PAGE_SIZE);
  var all = listItems_(params);
  var start = (page - 1) * pageSize;
  var items = all.slice(start, start + pageSize);

  return {
    items: items,
    total: all.length,
    page: page,
    has_more: start + pageSize < all.length
  };
}

function getFeedData_(params, userName) {
  var page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  var pageSize = clamp_(parseInt(params.page_size || INTERIOR_CONFIG_206.DEFAULT_PAGE_SIZE, 10) || INTERIOR_CONFIG_206.DEFAULT_PAGE_SIZE, 1, INTERIOR_CONFIG_206.MAX_PAGE_SIZE);
  var statusFilter = str_(params.status || 'all');
  var allBeforeStatus = listItems_(params);
  var allIds = allBeforeStatus.map(function (item) { return item.item_id; });
  var allReactions = getReactionMapForIds_(allIds, userName);

  var filtered = allBeforeStatus;
  if (statusFilter && statusFilter !== 'all') {
    filtered = allBeforeStatus.filter(function (item) {
      var status = computeDecisionStatus_(item, allReactions[item.item_id] || emptyReaction_());
      if (statusFilter === 'agreed') return status === 'agreed' || status === 'selected';
      return status === statusFilter;
    });
  }

  var start = (page - 1) * pageSize;
  var items = filtered.slice(start, start + pageSize);
  var reactions = {};
  items.forEach(function (item) {
    var reaction = allReactions[item.item_id] || emptyReaction_();
    reaction.status = computeDecisionStatus_(item, reaction);
    reactions[item.item_id] = reaction;
  });

  return {
    items: items,
    reactions: reactions,
    comment_counts: getCommentCountsForIds_(items.map(function (item) { return item.item_id; })),
    total: filtered.length,
    page: page,
    has_more: start + pageSize < filtered.length
  };
}

function getReactionsData_(params, userName) {
  var itemIds = str_(params.item_ids || '').split(',').map(function (s) { return str_(s); }).filter(Boolean);
  return { reactions: getReactionMapForIds_(itemIds, userName) };
}


function getCommentsData_(params) {
  var itemId = str_(params.item_id || '');
  if (!itemId) throw new Error('item_id is required');
  ensureAllSheets_();
  var table = readTable_('comments');
  var comments = table.rows
    .filter(function (row) { return str_(row.item_id) === itemId; })
    .map(function (row) {
      return {
        comment_id: str_(row.comment_id),
        item_id: str_(row.item_id),
        user_name: str_(row.user_name),
        text: str_(row.text),
        created_at: iso_(row.created_at)
      };
    })
    .sort(function (a, b) { return dateMs_(a.created_at) - dateMs_(b.created_at); });
  return { comments: comments };
}

function getCommentCountsForIds_(itemIds) {
  var wanted = {};
  (itemIds || []).forEach(function (id) { if (str_(id)) wanted[str_(id)] = 0; });
  var keys = Object.keys(wanted);
  if (!keys.length) return {};
  ensureAllSheets_();
  var table = readTable_('comments');
  table.rows.forEach(function (row) {
    var itemId = str_(row.item_id);
    if (wanted[itemId] !== undefined) wanted[itemId]++;
  });
  return wanted;
}

function getSummaryData_() {
  var spaces = getSpacesData_().spaces;
  var items = listItems_({ page_size: 10000 });
  var reactions = getReactionMapForIds_(items.map(function (item) { return item.item_id; }), '');

  var bySpace = {};
  spaces.forEach(function (space) {
    bySpace[space.space_id] = {
      space_id: space.space_id,
      name: space.name,
      icon: space.icon,
      total: 0,
      agreed: 0,
      selected: 0,
      conflict: 0,
      hold: 0,
      rejected: 0,
      question: 0,
      rate: 0
    };
  });

  items.forEach(function (item) {
    if (!bySpace[item.space_id]) return;
    var reaction = reactions[item.item_id] || emptyReaction_();
    var status = computeDecisionStatus_(item, reaction);
    var row = bySpace[item.space_id];
    row.total++;
    if (status === 'agreed' || status === 'selected') row.agreed++;
    if (status === 'selected') row.selected++;
    if (status === 'conflict') row.conflict++;
    if (status === 'hold') row.hold++;
    if (status === 'rejected') row.rejected++;
    if (status === 'question') row.question++;
  });

  var summary = spaces.map(function (space) {
    var row = bySpace[space.space_id];
    row.rate = row.total > 0 ? Math.round((row.agreed / row.total) * 100) : 0;
    return row;
  });

  var totals = summary.reduce(function (acc, row) {
    acc.total += row.total;
    acc.agreed += row.agreed;
    acc.selected += row.selected;
    acc.conflict += row.conflict;
    acc.hold += row.hold;
    acc.rejected += row.rejected;
    acc.question += row.question;
    return acc;
  }, { total: 0, agreed: 0, selected: 0, conflict: 0, hold: 0, rejected: 0, question: 0 });

  return { summary: summary, totals: totals };
}

function getBriefData_() {
  var spaces = getSpacesData_().spaces;
  var items = listItems_({ page_size: 10000 });
  var reactions = getReactionMapForIds_(items.map(function (item) { return item.item_id; }), '');
  var summary = getSummaryData_();

  var groups = spaces.map(function (space) {
    var spaceItems = items.filter(function (item) { return item.space_id === space.space_id; });
    var enriched = spaceItems.map(function (item) {
      var reaction = reactions[item.item_id] || emptyReaction_();
      var status = computeDecisionStatus_(item, reaction);
      var copy = clone_(item);
      copy.reaction = reaction;
      copy.decision_status = status;
      return copy;
    });

    return {
      space_id: space.space_id,
      name: space.name,
      icon: space.icon,
      selected: enriched.filter(function (item) { return item.decision_status === 'selected' || item.decision_status === 'agreed'; }),
      questions: enriched.filter(function (item) { return item.decision_status === 'question'; }),
      avoid: enriched.filter(function (item) { return item.decision_status === 'rejected'; }),
      conflicts: enriched.filter(function (item) { return item.decision_status === 'conflict'; }),
      hold: enriched.filter(function (item) { return item.decision_status === 'hold'; }),
      candidates: enriched.filter(function (item) { return item.decision_status === 'candidate'; })
    };
  }).filter(function (space) {
    return space.selected.length || space.questions.length || space.avoid.length || space.conflicts.length || space.hold.length || space.candidates.length;
  });

  return {
    generated_at: new Date().toISOString(),
    spaces: groups,
    summary: summary.summary,
    totals: summary.totals
  };
}

function diagnoseData_() {
  ensureAllSheets_();
  seedDefaultSpacesIfNeeded_();
  var counts = {};
  Object.keys(INTERIOR_HEADERS_206).forEach(function (name) {
    var table = readTable_(name);
    counts[name] = table.rows.length;
  });
  return {
    version: INTERIOR_CONFIG_206.APP_VERSION,
    now: new Date().toISOString(),
    spreadsheet_id: INTERIOR_CONFIG_206.SHEET_ID,
    sheets: Object.keys(INTERIOR_HEADERS_206),
    counts: counts
  };
}

// ── WRITE API ────────────────────────────────


function beginPhotoUploadData_(body, user) {
  ensureAllSheets_();
  var spaceId = str_(body.space_id);
  if (!spaceId) throw new Error('space_id is required');

  var chunkCount = Math.floor(number_(body.chunk_count, 0));
  var totalChars = Math.floor(number_(body.total_chars, 0));
  if (chunkCount < 1 || chunkCount > INTERIOR_CONFIG_206.MAX_UPLOAD_CHUNKS) {
    throw new Error('사진 조각 수가 올바르지 않습니다.');
  }
  if (totalChars < 1 || totalChars > INTERIOR_CONFIG_206.MAX_BASE64_CHARS) {
    throw new Error('사진 용량이 너무 큽니다. 더 작은 사진을 선택해주세요.');
  }

  var uploadId = generateId_('up');
  var meta = {
    upload_id: uploadId,
    space_id: spaceId,
    type: 'photo',
    title: clean_(body.title || '사진 레퍼런스', 200),
    memo: clean_(body.memo, 1200),
    category: normalizeCategory_(body.category),
    priority: normalizePriority_(body.priority),
    brief_status: normalizeBriefStatus_(body.brief_status || 'candidate'),
    tags: clean_(body.tags, 300),
    why_good: clean_(body.why_good, 800),
    caution: clean_(body.caution, 800),
    image_name: cleanFileName_(body.image_name || 'photo.jpg'),
    mime_type: 'image/jpeg',
    chunk_count: chunkCount,
    total_chars: totalChars,
    created_by: normalizeUserName_(user && user.name),
    created_at: new Date().toISOString()
  };

  // CacheService는 큰 이미지 누적 저장에 취약할 수 있어, 업로드 조각은 전용 Sheet에 임시 저장합니다.
  appendObject_('upload_chunks', {
    upload_id: uploadId,
    chunk_index: 'meta',
    chunk: JSON.stringify(meta),
    created_at: new Date().toISOString()
  });

  return {
    upload_id: uploadId,
    chunk_count: chunkCount,
    chunk_size: INTERIOR_CONFIG_206.UPLOAD_CHUNK_CHAR_SIZE
  };
}

function uploadPhotoChunkData_(body, user) {
  ensureAllSheets_();
  var uploadId = str_(body.upload_id);
  if (!uploadId) throw new Error('upload_id is required');
  var chunkIndex = Math.floor(number_(body.chunk_index, -1));
  var chunk = str_(body.chunk);
  var meta = getPhotoUploadMeta_(uploadId);

  if (chunkIndex < 0 || chunkIndex >= meta.chunk_count) throw new Error('사진 조각 번호가 올바르지 않습니다.');
  if (!chunk) throw new Error('비어 있는 사진 조각입니다.');
  if (chunk.length > INTERIOR_CONFIG_206.UPLOAD_CHUNK_CHAR_SIZE + 2000) throw new Error('사진 조각이 너무 큽니다.');
  if (!/^[A-Za-z0-9+/=]+$/.test(chunk)) throw new Error('사진 데이터 형식이 올바르지 않습니다.');

  appendObject_('upload_chunks', {
    upload_id: uploadId,
    chunk_index: chunkIndex,
    chunk: chunk,
    created_at: new Date().toISOString()
  });
  return { upload_id: uploadId, chunk_index: chunkIndex, received_chars: chunk.length };
}

function finishPhotoUploadData_(body, user) {
  ensureAllSheets_();
  var uploadId = str_(body.upload_id);
  if (!uploadId) throw new Error('upload_id is required');
  var meta = getPhotoUploadMeta_(uploadId);
  var table = readTable_('upload_chunks');
  var byIndex = {};

  table.rows.forEach(function (row) {
    if (str_(row.upload_id) !== uploadId) return;
    var idxText = str_(row.chunk_index);
    if (idxText === 'meta') return;
    var idx = Math.floor(number_(idxText, -1));
    if (idx < 0 || idx >= meta.chunk_count) return;
    // 같은 chunk가 재시도 때문에 여러 번 들어오면 가장 최근 행으로 덮어씁니다.
    byIndex[idx] = str_(row.chunk);
  });

  var chunks = [];
  var received = 0;
  for (var i = 0; i < meta.chunk_count; i++) {
    var part = byIndex[i];
    if (!part) throw new Error('사진 조각 ' + (i + 1) + '/' + meta.chunk_count + ' 수신 실패. 다시 시도해주세요.');
    chunks.push(part);
    received += part.length;
  }

  if (received !== Number(meta.total_chars)) {
    throw new Error('사진 데이터 길이가 맞지 않습니다. 다시 시도해주세요.');
  }

  var addBody = {
    space_id: meta.space_id,
    type: 'photo',
    title: meta.title,
    memo: meta.memo,
    category: meta.category,
    priority: meta.priority,
    brief_status: meta.brief_status,
    tags: meta.tags,
    why_good: meta.why_good,
    caution: meta.caution,
    image_name: meta.image_name,
    image_base64: chunks.join('')
  };

  var item = addItemData_(addBody, { name: meta.created_by || normalizeUserName_(user && user.name) });
  cleanupPhotoUpload_(uploadId);
  item.upload_id = uploadId;
  return item;
}

function cancelPhotoUploadData_(body, user) {
  var uploadId = str_(body.upload_id);
  if (!uploadId) return { cancelled: false };
  cleanupPhotoUpload_(uploadId);
  return { cancelled: true, upload_id: uploadId };
}

function getPhotoUploadMeta_(uploadId) {
  var table = readTable_('upload_chunks');
  var rows = table.rows.filter(function (row) {
    return str_(row.upload_id) === uploadId && str_(row.chunk_index) === 'meta';
  });
  if (!rows.length) throw new Error('업로드 세션이 없습니다. 다시 시도해주세요.');
  rows.sort(function (a, b) { return dateMs_(b.created_at) - dateMs_(a.created_at); });
  return JSON.parse(str_(rows[0].chunk));
}

function cleanupPhotoUpload_(uploadId) {
  try {
    var table = readTable_('upload_chunks');
    for (var i = table.rows.length - 1; i >= 0; i--) {
      var row = table.rows[i];
      if (str_(row.upload_id) === uploadId) {
        table.sheet.deleteRow(row._row);
      }
    }
  } catch (e) {}
}

function addItemData_(body, user) {
  var spaceId = str_(body.space_id);
  var type = str_(body.type || 'memo');
  if (!spaceId) throw new Error('space_id is required');
  if (INTERIOR_VALID_TYPES_206.indexOf(type) === -1) throw new Error('invalid type');

  var contentUrl = normalizeUrl_(body.content_url);
  var thumbnailUrl = normalizeUrl_(body.thumbnail_url);
  var title = clean_(body.title, 200);
  var memo = clean_(body.memo, 1200);
  var category = normalizeCategory_(body.category);
  var tags = clean_(body.tags, 300);
  var whyGood = clean_(body.why_good, 800);
  var caution = clean_(body.caution, 800);
  var priority = normalizePriority_(body.priority);
  var briefStatus = normalizeBriefStatus_(body.brief_status || 'candidate');

  if (type === 'photo') {
    if (!str_(body.image_base64)) throw new Error('사진 파일이 없습니다.');
    var upload = uploadToDrive_(str_(body.image_base64), cleanFileName_(body.image_name || 'photo.jpg'), spaceId);
    contentUrl = upload.url;
    thumbnailUrl = upload.thumbnailUrl || upload.url;
    if (!title) title = '사진 레퍼런스';
  }

  if (type === 'link') {
    if (!contentUrl) throw new Error('URL을 입력해주세요.');
    if (!title) title = hostnameFromUrl_(contentUrl) || '링크 레퍼런스';
  }

  if (type === 'memo' && !memo && !whyGood && !caution) {
    throw new Error('메모 내용을 입력해주세요.');
  }

  var itemId = generateId_('it');
  var now = new Date().toISOString();
  appendObject_('items', {
    item_id: itemId,
    space_id: spaceId,
    type: type,
    content_url: contentUrl,
    thumbnail_url: thumbnailUrl,
    title: title,
    memo: memo,
    created_by: user.name,
    created_at: now,
    is_deleted: false,
    category: category,
    tags: tags,
    why_good: whyGood,
    caution: caution,
    priority: priority,
    brief_status: briefStatus,
    updated_at: now
  });

  return { item_id: itemId, created_at: now };
}

function setReactionData_(body, user) {
  var itemId = str_(body.item_id);
  var reaction = str_(body.reaction);
  if (!itemId) throw new Error('item_id is required');
  if (reaction !== 'clear' && INTERIOR_VALID_REACTIONS_206.indexOf(reaction) === -1) throw new Error('invalid reaction');

  var table = readTable_('reactions');
  var now = new Date().toISOString();
  var matches = table.rows.filter(function (row) {
    return str_(row.item_id) === itemId && str_(row.user_name) === user.name;
  });

  if (matches.length) {
    if (reaction === 'clear') {
      matches.sort(function (a, b) { return b._row - a._row; }).forEach(function (row) {
        table.sheet.deleteRow(row._row);
      });
      return { item_id: itemId, reaction: null, cleared: true };
    }

    var latest = matches[matches.length - 1];
    updateObjectRow_('reactions', latest._row, {
      reaction: reaction,
      updated_at: now
    });

    matches.slice(0, -1).sort(function (a, b) { return b._row - a._row; }).forEach(function (row) {
      table.sheet.deleteRow(row._row);
    });

    return { item_id: itemId, reaction: reaction, updated: true };
  }

  if (reaction === 'clear') {
    return { item_id: itemId, reaction: null, cleared: true };
  }

  appendObject_('reactions', {
    reaction_id: generateId_('rx'),
    item_id: itemId,
    user_name: user.name,
    reaction: reaction,
    updated_at: now
  });

  return { item_id: itemId, reaction: reaction, updated: false };
}

function updateItemData_(body, user) {
  var itemId = str_(body.item_id);
  if (!itemId) throw new Error('item_id is required');

  var table = readTable_('items');
  var target = table.rows.find(function (row) { return str_(row.item_id) === itemId && !isDeleted_(row.is_deleted); });
  if (!target) throw new Error('항목을 찾을 수 없습니다.');

  var fields = { updated_at: new Date().toISOString() };
  if (body.space_id !== undefined) fields.space_id = str_(body.space_id);
  if (body.title !== undefined) fields.title = clean_(body.title, 200);
  if (body.memo !== undefined) fields.memo = clean_(body.memo, 1200);
  if (body.category !== undefined) fields.category = normalizeCategory_(body.category);
  if (body.tags !== undefined) fields.tags = clean_(body.tags, 300);
  if (body.why_good !== undefined) fields.why_good = clean_(body.why_good, 800);
  if (body.caution !== undefined) fields.caution = clean_(body.caution, 800);
  if (body.priority !== undefined) fields.priority = normalizePriority_(body.priority);
  if (body.brief_status !== undefined) fields.brief_status = normalizeBriefStatus_(body.brief_status);

  updateObjectRow_('items', target._row, fields);
  return { item_id: itemId, updated: true, updated_at: fields.updated_at };
}

function addCommentData_(body, user) {
  var itemId = str_(body.item_id);
  var text = clean_(body.text, 1000);
  if (!itemId) throw new Error('item_id is required');
  if (!text) throw new Error('댓글 내용을 입력해주세요.');

  var now = new Date().toISOString();
  var commentId = generateId_('cm');
  appendObject_('comments', {
    comment_id: commentId,
    item_id: itemId,
    user_name: user.name,
    text: text,
    created_at: now
  });
  return { comment_id: commentId, created_at: now };
}

function saveSpaceData_(body) {
  var name = clean_(body.name, 80);
  var icon = clean_(body.icon || '🏠', 8);
  var spaceId = str_(body.space_id);
  if (!name) throw new Error('공간 이름을 입력해주세요.');

  var table = readTable_('spaces');
  var now = new Date().toISOString();

  if (spaceId) {
    var target = table.rows.find(function (row) { return str_(row.space_id) === spaceId; });
    if (!target) throw new Error('공간을 찾을 수 없습니다.');
    var fields = { name: name, icon: icon, updated_at: now, is_active: true };
    if (body.order_index !== undefined) fields.order_index = number_(body.order_index, target.order_index || 999);
    updateObjectRow_('spaces', target._row, fields);
    return { space_id: spaceId, updated: true };
  }

  var activeRows = table.rows.filter(function (row) { return isActive_(row.is_active); });
  var maxOrder = activeRows.reduce(function (max, row) { return Math.max(max, number_(row.order_index, 0)); }, 0);
  var newId = 'sp_' + Utilities.getUuid().slice(0, 8);
  appendObject_('spaces', {
    space_id: newId,
    name: name,
    icon: icon,
    order_index: body.order_index !== undefined ? number_(body.order_index, maxOrder + 1) : maxOrder + 1,
    is_active: true,
    created_at: now,
    updated_at: now
  });
  return { space_id: newId, updated: false };
}

function deleteItemData_(body, user) {
  var itemId = str_(body.item_id);
  if (!itemId) throw new Error('item_id is required');

  var table = readTable_('items');
  var target = table.rows.find(function (row) { return str_(row.item_id) === itemId && !isDeleted_(row.is_deleted); });
  if (!target) throw new Error('항목을 찾을 수 없습니다.');

  updateObjectRow_('items', target._row, {
    is_deleted: true,
    updated_at: new Date().toISOString()
  });
  return { item_id: itemId, deleted: true };
}

// ── 내부 데이터 처리 ─────────────────────────

function listItems_(params) {
  ensureAllSheets_();
  var table = readTable_('items');
  var spaceId = str_(params.space_id || '');
  var category = str_(params.category || '');
  var q = str_(params.q || '').toLowerCase();

  return table.rows
    .filter(function (row) {
      if (!str_(row.item_id)) return false;
      if (isDeleted_(row.is_deleted)) return false;
      if (spaceId && spaceId !== 'all' && str_(row.space_id) !== spaceId) return false;
      if (category && category !== 'all' && str_(row.category || 'etc') !== category) return false;
      if (q) {
        var haystack = [row.title, row.memo, row.tags, row.why_good, row.caution, row.created_by].join(' ').toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    })
    .map(publicItem_)
    .sort(function (a, b) { return dateMs_(b.created_at) - dateMs_(a.created_at); });
}

function publicItem_(row) {
  return {
    item_id: str_(row.item_id),
    space_id: str_(row.space_id),
    type: str_(row.type || 'memo'),
    content_url: str_(row.content_url),
    thumbnail_url: str_(row.thumbnail_url),
    title: str_(row.title),
    memo: str_(row.memo),
    created_by: str_(row.created_by),
    created_at: iso_(row.created_at),
    category: normalizeCategory_(row.category || 'etc'),
    category_label: INTERIOR_CATEGORY_META_206[normalizeCategory_(row.category || 'etc')] || '기타',
    tags: str_(row.tags),
    why_good: str_(row.why_good),
    caution: str_(row.caution),
    priority: normalizePriority_(row.priority || 'medium'),
    brief_status: normalizeBriefStatus_(row.brief_status || 'candidate'),
    updated_at: iso_(row.updated_at || row.created_at)
  };
}

function getReactionMapForIds_(itemIds, userName) {
  var idMap = {};
  itemIds.forEach(function (id) {
    if (id) idMap[id] = emptyReaction_();
  });
  if (!Object.keys(idMap).length) return {};

  var table = readTable_('reactions');
  var latestByUser = {};
  table.rows.forEach(function (row) {
    var itemId = str_(row.item_id);
    var reaction = str_(row.reaction);
    var rowUser = str_(row.user_name);
    if (!idMap[itemId]) return;
    if (!rowUser || INTERIOR_VALID_REACTIONS_206.indexOf(reaction) === -1) return;

    var key = itemId + '::' + rowUser;
    var current = latestByUser[key];
    if (!current || dateMs_(row.updated_at) >= dateMs_(current.updated_at)) {
      latestByUser[key] = { item_id: itemId, user_name: rowUser, reaction: reaction, updated_at: row.updated_at };
    }
  });

  Object.keys(latestByUser).forEach(function (key) {
    var row = latestByUser[key];
    idMap[row.item_id][row.reaction]++;
    idMap[row.item_id].users[row.reaction].push(row.user_name);
    if (userName && row.user_name === userName) idMap[row.item_id].mine = row.reaction;
  });

  return idMap;
}

function emptyReaction_() {
  return {
    love: 0,
    no: 0,
    hold: 0,
    mine: null,
    users: { love: [], no: [], hold: [] }
  };
}

function computeDecisionStatus_(item, reaction) {
  var explicit = normalizeBriefStatus_(item.brief_status || 'candidate');
  if (explicit === 'selected') return 'selected';
  if (explicit === 'question') return 'question';
  if (explicit === 'avoid') return 'rejected';
  if ((reaction.love || 0) >= 2) return 'agreed';
  if ((reaction.no || 0) >= 2) return 'rejected';
  if ((reaction.love || 0) >= 1 && (reaction.no || 0) >= 1) return 'conflict';
  if ((reaction.hold || 0) >= 1) return 'hold';
  return 'candidate';
}

// ── Spreadsheet 유틸 ─────────────────────────

function getSpreadsheet_() {
  if (!INTERIOR_SS_CACHE_206) INTERIOR_SS_CACHE_206 = SpreadsheetApp.openById(INTERIOR_CONFIG_206.SHEET_ID);
  return INTERIOR_SS_CACHE_206;
}

function ensureAllSheets_() {
  Object.keys(INTERIOR_HEADERS_206).forEach(function (name) { ensureSheet_(name); });
}

function ensureSheet_(name) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  var headers = INTERIOR_HEADERS_206[name];
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  var range = sheet.getRange(1, 1, 1, headers.length);
  var current = range.getValues()[0].map(function (v) { return str_(v); });
  var changed = false;
  for (var i = 0; i < headers.length; i++) {
    if (current[i] !== headers[i]) { changed = true; break; }
  }
  if (changed) range.setValues([headers]);
  return sheet;
}

function seedDefaultSpacesIfNeeded_() {
  var table = readTable_('spaces');
  var activeRows = table.rows.filter(function (row) { return str_(row.space_id) && str_(row.name) && isActive_(row.is_active); });
  if (activeRows.length > 0) return;

  // 예전 시트에서 is_active만 비어 있거나 헤더가 재정렬된 경우, space_id/name이 있는 행을 먼저 살립니다.
  var reusableRows = table.rows.filter(function (row) { return str_(row.space_id) && str_(row.name); });
  if (reusableRows.length > 0) {
    var now = new Date().toISOString();
    reusableRows.forEach(function (row, index) {
      updateObjectRow_('spaces', row._row, {
        icon: str_(row.icon || '🏠'),
        order_index: number_(row.order_index, index + 1),
        is_active: true,
        updated_at: now
      });
    });
    return;
  }

  upsertDefaultSpaces_();
}

function ensureDefaultSpacesData_() {
  ensureAllSheets_();
  upsertDefaultSpaces_();
  return getSpacesData_();
}

function upsertDefaultSpaces_() {
  var table = readTable_('spaces');
  var now = new Date().toISOString();

  INTERIOR_DEFAULT_SPACES_206.forEach(function (space) {
    var id = space[0];
    var fallbackName = space[1];
    var fallbackIcon = space[2];
    var fallbackOrder = space[3];
    var existing = table.rows.find(function (row) { return str_(row.space_id) === id; });

    if (existing) {
      updateObjectRow_('spaces', existing._row, {
        name: str_(existing.name) || fallbackName,
        icon: str_(existing.icon) || fallbackIcon,
        order_index: number_(existing.order_index, fallbackOrder),
        is_active: true,
        updated_at: now
      });
      return;
    }

    appendObject_('spaces', {
      space_id: id,
      name: fallbackName,
      icon: fallbackIcon,
      order_index: fallbackOrder,
      is_active: true,
      created_at: now,
      updated_at: now
    });
  });
}

function readTable_(name) {
  var sheet = ensureSheet_(name);
  var headers = INTERIOR_HEADERS_206[name];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return { sheet: sheet, headers: headers, rows: [] };

  var firstRow = values[0].map(function (v) { return str_(v); });
  var indexes = {};
  headers.forEach(function (h, fallbackIndex) {
    var found = firstRow.indexOf(h);
    indexes[h] = found >= 0 ? found : fallbackIndex;
  });

  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var obj = { _row: r + 1 };
    headers.forEach(function (h) {
      obj[h] = values[r][indexes[h]] !== undefined ? values[r][indexes[h]] : '';
    });
    rows.push(obj);
  }

  return { sheet: sheet, headers: headers, rows: rows };
}

function appendObject_(name, obj) {
  var sheet = ensureSheet_(name);
  var row = INTERIOR_HEADERS_206[name].map(function (h) {
    return obj[h] !== undefined ? obj[h] : '';
  });
  sheet.appendRow(row);
}

function updateObjectRow_(name, rowNumber, fields) {
  var sheet = ensureSheet_(name);
  var headers = INTERIOR_HEADERS_206[name];
  var range = sheet.getRange(rowNumber, 1, 1, headers.length);
  var values = range.getValues()[0];

  Object.keys(fields).forEach(function (key) {
    var idx = headers.indexOf(key);
    if (idx >= 0) values[idx] = fields[key];
  });

  range.setValues([values]);
}


function driveDiagnoseData_() {
  ensureAllSheets_();
  var folderId = getOrCreateFolder_('diagnose');
  var folder = DriveApp.getFolderById(folderId);
  var testFile = folder.createFile(Utilities.newBlob('ok ' + new Date().toISOString(), 'text/plain', 'interior_upload_test.txt'));
  var fileId = testFile.getId();
  var sharingOk = false;
  var sharingError = '';
  try {
    testFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    sharingOk = true;
  } catch (shareErr) {
    sharingError = shareErr && shareErr.message ? shareErr.message : String(shareErr);
  }
  testFile.setTrashed(true);
  return {
    version: INTERIOR_CONFIG_206.APP_VERSION,
    folder_id: folderId,
    folder_name: folder.getName(),
    test_file_id: fileId,
    test_file_created: true,
    test_file_trashed: true,
    public_sharing_allowed: sharingOk,
    public_sharing_error: sharingError
  };
}

// ── Drive 업로드 ─────────────────────────────

function uploadToDrive_(base64Data, fileName, spaceId) {
  var folderId = getOrCreateFolder_(spaceId);
  var folder = DriveApp.getFolderById(folderId);
  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, 'image/jpeg', fileName);
  var file = folder.createFile(blob);
  var fileId = file.getId();
  var sharingOk = false;
  var sharingError = '';
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    sharingOk = true;
  } catch (shareErr) {
    // Some Google Workspace / Drive policies block public link sharing.
    // Upload itself should still succeed; do not fail the whole save.
    sharingError = shareErr && shareErr.message ? shareErr.message : String(shareErr);
  }
  return {
    url: 'https://drive.google.com/file/d/' + fileId + '/view?usp=drivesdk',
    thumbnailUrl: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600',
    fileId: fileId,
    publicSharing: sharingOk,
    sharingError: sharingError
  };
}

function getOrCreateFolder_(spaceId) {
  var rootFolders = DriveApp.getFoldersByName(INTERIOR_CONFIG_206.DRIVE_ROOT_FOLDER);
  var root = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(INTERIOR_CONFIG_206.DRIVE_ROOT_FOLDER);
  var safeSpaceId = str_(spaceId || 'common') || 'common';
  var subFolders = root.getFoldersByName(safeSpaceId);
  return subFolders.hasNext() ? subFolders.next().getId() : root.createFolder(safeSpaceId).getId();
}

// ── 공통 유틸 ────────────────────────────────

function parseBody_(e) {
  if (!e) return {};
  if (e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  if (e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  return e.parameter || {};
}

function assertClientPin_(input) {
  if (!INTERIOR_CONFIG_206.REQUIRE_PIN) return;
  if (str_(input.app_pin) !== INTERIOR_CONFIG_206.APP_PIN) throw new Error('권한 확인 실패');
}

function normalizeUserName_(name) {
  var value = clean_(name || '알 수 없음', 40);
  return value || '알 수 없음';
}


function postMessageOutput_(data, targetOrigin, requestId) {
  var origin = str_(targetOrigin || '*');
  if (origin !== '*' && !/^https?:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?$/.test(origin)) origin = '*';

  var message = {
    source: 'interior-app-api',
    request_id: str_(requestId || ''),
    result: data
  };
  var messageJson = JSON.stringify(message).replace(/</g, '\\u003c');
  var originJson = JSON.stringify(origin).replace(/</g, '\\u003c');
  var html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>(function(){var msg=' + messageJson + ';var origin=' + originJson + ';' +
    'try{window.parent.postMessage(msg,origin);}catch(e){window.parent.postMessage(msg,"*");}' +
    '})();<\/script></body></html>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function output_(data, callback) {
  var text = JSON.stringify(data);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + text + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  var out = data || {};
  out.ok = true;
  return out;
}

function fail_(err) {
  return {
    ok: false,
    error: err && err.message ? err.message : String(err || 'unknown error')
  };
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function generateId_(prefix) {
  return prefix + '_' + Date.now() + '_' + Utilities.getUuid().slice(0, 8);
}

function str_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function clean_(value, maxLen) {
  var text = str_(value);
  if (maxLen && text.length > maxLen) text = text.slice(0, maxLen);
  return text;
}

function cleanFileName_(value) {
  var raw = clean_(value || 'photo.jpg', 120);
  var safe = raw.replace(/[\\/:*?"<>|]/g, '_');
  return /\.(jpg|jpeg|png|webp)$/i.test(safe) ? safe : safe + '.jpg';
}

function number_(value, fallback) {
  var n = Number(value);
  return isNaN(n) ? fallback : n;
}

function clamp_(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isActive_(value) {
  if (value === true) return true;
  var v = str_(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function isDeleted_(value) {
  if (value === true) return true;
  var v = str_(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function iso_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  var ms = Date.parse(value);
  return isNaN(ms) ? str_(value) : new Date(ms).toISOString();
}

function dateMs_(value) {
  var ms = Date.parse(value);
  return isNaN(ms) ? 0 : ms;
}

function clone_(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeCategory_(value) {
  var v = str_(value || 'etc');
  return INTERIOR_CATEGORY_META_206[v] ? v : 'etc';
}

function normalizePriority_(value) {
  var v = str_(value || 'medium');
  return INTERIOR_VALID_PRIORITY_206.indexOf(v) >= 0 ? v : 'medium';
}

function normalizeBriefStatus_(value) {
  var v = str_(value || 'candidate');
  if (v === 'rejected') return 'avoid';
  return INTERIOR_VALID_STATUS_206.indexOf(v) >= 0 ? v : 'candidate';
}

function normalizeUrl_(value) {
  var raw = str_(value);
  if (!raw) return '';
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

  // Apps Script V8 환경에서는 브라우저의 URL 객체가 없을 수 있어 정규식으로 검증합니다.
  if (!/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(raw)) {
    throw new Error('URL 형식이 올바르지 않습니다.');
  }
  return raw;
}

function hostnameFromUrl_(url) {
  var match = str_(url).match(/^https?:\/\/([^\/?#]+)/i);
  return match ? match[1].replace(/^www\./i, '') : '';
}

// 수동 점검용: Apps Script 편집기에서 runSetupOnce를 한 번 실행하면 권한 승인과 시트 헤더 정리가 됩니다.
function runSetupOnce() {
  ensureAllSheets_();
  ensureDefaultSpacesData_();
  getOrCreateFolder_('diagnose');
  return diagnoseData_();
}


// 브라우저가 아니라 Apps Script 자체 실행 여부를 편집기에서 바로 확인하는 함수입니다.
function interiorSmokeTest() {
  return doGet({ parameter: { action: 'ping' } }).getContent();
}
