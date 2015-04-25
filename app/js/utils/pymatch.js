/* 模糊拼音匹配算法
首次使用:
var p = new Pymatch([{id:1,name:"张三",py:"zhang;san"},{id:2,name:"李四",py:"li;si"},{id:5,name:"张JohnSmith李Mary四",py:"zhang;li;si"},{id:8,name:"查理",py:"cha,zha;li"}])
多音字的不同拼音用','分隔，如前面的"cha,zha"
直接匹配:
p.match("zs")相当于p.clear();p.input("zs");return p.get_match()
当用户开始输入:
p.input('z')
p.input('h')
p.input('an')
p.input('gsa')
p.input('n')
p.input("李四")
当用户回退:
p.back(1) // 回到输入了"zhangsan李"的状态
p.back(3) // 回到输入了"zhangs"的状态
清空所有输入:
p.clear()
当用户的联系人列表变化时(会自动清空所有输入):
p.setNames([{name:"张三",py:"zhang;san"},{name:"李四",py:"li;si"},{name:"张JohnSmith李Mary四",py:"zhang;li;si"},{name:"王二",py:"wang;er"}])

p的内部数据结构
rnames:[{id:1,...}, {id:2,...}, {id:5,...}, {id:8,...}, {id:9,...}], // ===原始的setNames设定的names
names:[["张三",["zhang"],["san"]],["李四",["li"],["si"]],["王三表",["wang"],["san"],["biao"]],[["张月五"],["zhang"],["yue"],["wu"]],["张;", ["zhang"], ["mary"]],["查理",["cha","zha"],["li"]]],
pyidx:{
z:[0,0,3,0,4,0], // 下标0,2,4,6,...表示z出现的名字在names中的位置
s:[0,1,1,1,2,1],
'ln':[1,0],
w:[2,0,3,2],
b:[2,2],
y:[3,1],
m:[4,1]
}
idx:{
张:[0,0,3,0,4,0],
三:[0,1,2,1],
李:[1,0],
四:[1,1],
王:[2,0],
表:[2,2],
月:[3,1],
五:[3,2]
}
*/
var Pymatch=(function(){
  function constructor(name2pys) { this.setNames(name2pys); }

  var simpy = { 'l': 'ln', 'n': 'ln' };
  var W_hzmatch = 1.2, // 汉字整字匹配权重
      W_first_exactly_match = 0.3, // 首字母精确匹配权重
      W_other_match = 1 - W_first_exactly_match, // 其它字母匹配权重
      W_fuzzy_match = 0.0, // 首字母模糊匹配权重
      W_zcs_match_zhchsh = 0.1; // 输入的zcs匹配拼音的zhchsh权重

  // 检查a,b是否模糊匹配
  function is_sim(a, b) {
    var sa=simpy[a];
    if(sa) {
      var sb = simpy[b];
      return sb && sa==sb;
    }
    return false;
  }

  function getAlt(py) {
    var c1 = py.charAt(0), c2;
    if(c1=='z' || c1=='c' || c1=='s') {
      c2 = py.charAt(1);
      return c1 + (c2 == 'h'? py.substr(2) : 'h' + py.substr(1));
    }
    var sc = simpy[c1];
    if(!sc) return false;
    c2 = sc.charAt(0);
    return (c2 == c1? sc.charAt(1): c2) + py.substr(1);
  }

  function split2(s, pinyin, cache) {
    var n=s.length, a=[];
    var t = s.charAt(0);
    if(t<'a' || t>'z') {
      if(n<=1)
        a = [[t]];
      else {
        var r = s.substr(1);
        var b = cache[r];
        if(b==undefined)
          b = split2(r, pinyin, cache);
        if(b) {
          if(b.length <= 1) b = b[0];
          a = [[t].concat(b)];
        }
      }
    }
    else {
      for(var k=1; k<=n; ++k) {
        t = s.substr(0, k);
        if(!pinyin[t])
          break;
        if(k<n) {
          var r = s.substr(k);
          var b = cache[r];
          if(b==undefined)
            b = split2(r, pinyin, cache);
          if(!b) continue;
          if(b.length <= 1) b = b[0];
          a.unshift([t].concat(b));
        }
        else
          a.unshift([t]);
      }
    }
    if(a.length <= 0)
      a = false;
    cache[s] = a;
    return a;
  }

  /* 检查拼音前缀是否和多音字的某个发音匹配
   pyprefix-拼音前缀
   pys-数组,每个元素是多音字的一个拼音
   isHz-true表示处理汉字模糊匹配, false不处理
   返回: false-不匹配, 浮点数-匹配度
   */
  function pymatch(pyprefix, pys, isHz) {
    var n = pys.length, i, k = pyprefix.length;
    for(i=0; i<n; ++i) {
      var py = pys[i];
      if(py.substr(0,k)==pyprefix) {
        var v = py.length-1;
        return v<=0? W_first_exactly_match: (W_first_exactly_match+W_other_match*(k-1)/v);
      }
    }

    if(isHz) {
      var alt = getAlt(pyprefix);
      if(!alt) return false;
      k = alt.length;
      for(i=0; i<n; ++i) {
        var py = pys[i];
        if(py.substr(0,k)==alt) {
          var v = py.length-1, m=W_fuzzy_match;
          var c1 = py.charAt(0);
          if(c1=='z'||c1=='c'||c1=='s') {
            m += W_zcs_match_zhchsh;
            var c2 = py.charAt(1);
            if(c2 == 'h') {
              k -= 1;
              v -= 1;
            }
          }
          if(v<=0)
            return m;
          return m+W_other_match*(k-1)/v;
        }
      }
    }
    return false;
  }

  /*
   pattern: split后的结果
   name: 数组, [0]是汉字名字, 从[1]开始是每个字的拼音数组(里面的元素是多音字的每个发音)
   i: 开始匹配的位置
   e: 结束匹配的位置(不含)
   inplace: false-一直向前找, true-就地匹配
   返回: false表示不匹配, [匹配位置, 匹配数, 匹配权重]
   */
  function pmatch(pattern, name, i, e, inplace) {
    if(!pattern) return false;
    var r, k=pattern.length, v=0;
    for(; v<k; ++v) {
      if(typeof(pattern[v])!="string")
        break;
    }
    while(i+v<=e) {
      var q = i, j=0, m=0.0;
      for(; j<v; ++j, ++q) {
        var p = pattern[j];
        var c = p.charAt(0);
        if(c>='a'&&c<='z') {
          r = pymatch(p, name[q], (name[0].charAt(q-1)!=';'));
          if(r===false) break;
          m += r;
        }
        else if(c == name[0].charAt(q-1))
          m += W_hzmatch;
        else
          break;
      }
      if(j>=v) {
        if(j>=k) return [i, v, m];
        for(; j<k; ++j) {
          var p = pattern[j];
          r = pmatch(p, name, q, e, true);
          if(r)
            return [i, v+r[1], m+r[2]];
        }
      }
      if(inplace) return false;
      ++i;
    }
    return false;
  }

  function match2(s, name, i, e) {
    if(s.length<=0) return false;

    if(i==undefined)
      i = 1;
    if(e==undefined)
      e = name.length;
    pinyin = {};
    for(var j=i; j<e; ++j) {
      var pys = name[j];
      var k = pys.length, m;
      var isHz = (name[0].charAt(j-1)!=';');
      for(m=0; m<k; ++m) {
        var py = pys[m];
        var n = py.length, v;
        for(v=1; v<=n; ++v)
          pinyin[py.substr(0,v)] = true;
        if(isHz) {
          var alt = getAlt(py);
          if(!alt) continue;
          n = alt.length;
          for(v=1; v<=n; ++v)
            pinyin[alt.substr(0,v)] = true;
        }
      }
    }

    var p = split2(s, pinyin, {});
    return pmatch(p, name, i, e, false);
  }

  // 匹配堆栈元素[idx, 匹配位置, 匹配数, 匹配权重]
  function input_c() {
    var k=this.stkp - 1;
    var i, n, a, b=[], t, ai;
    if(k<=0) {
      var c = this.instr[k];
      var is_py = (c>='a' && c<='z');
      if(is_py) {
        var sc = simpy[c];
        if(!sc) sc = c;
        a = this.pyidx[sc];
      }
      else
        a = this.idx[c];
      if(a) {
        n = a.length;
        for(i=0; i<n; i+=2) {
          var x = a[i], j=a[i+1], name=this.names[x];
          if(is_py) {
            var tpys = name[j+1];
            var tn = tpys.length, ti;
            var m = W_fuzzy_match; // 默认模糊匹配
            for(ti=0; ti<tn; ++ti) {
              var tpy = tpys[ti], d = tpy.charAt(0);
              if(c == d) {
                if(name[0].charAt(j)!=';' && (c=='z'||c=='c'||c=='s') && tpy.charAt(1)=='h')
                  m = W_zcs_match_zhchsh; // zcs匹配zh/ch/sh
                else
                  m = W_first_exactly_match; // 首字母精确匹配
                break;
              }
              if(is_sim(c, d))
                break;
            }
            if(ti>=tn) throw "Pymatch internal data error";
            t = [x, j+1, 1, m];
          }
          else
            t = [x, j+1, 1, W_hzmatch]; // 汉字整字匹配
          b.push(t);
        }
      }
    }
    else {
      a = this.stack[k-1];
      n = a.length;
      var s = this.instr.substr(0,k+1);
      for(i=0; i<n; ++i) {
        ai = a[i];
        var x = ai[0];
        t = match2(s, this.names[x], ai[1]);
        if(t)
          b.push([x].concat(t));
      }
    }
    this.stack[k] = b;
  }

  constructor.prototype = {
    setNames: function(name2pys) {
      this.rnames = name2pys;
      this.names = [];
      this.pyidx = {};
      this.idx = {};
      this.stack = [];
      this.instr = "";
      this.stkp = 0;

      var i, n = name2pys ? name2pys.length : 0;
      for(i=0; i<n; ++i) {
        var name2py = name2pys[i];
        var hz = name2py.name;
        var pys = name2py.py;
        pys = ((!pys || pys=="") ? []: pys.split(';'));
        var k=hz.length, j, m, nhz="", t=0, x=i;
        var searchLetter=true; // 0-正在寻找连续英文串的开始(大写或小写字母), 1-正在寻找结束
        for(j=0; j<k; ++j) {
          var c = hz.charAt(j);
          if(searchLetter) {
            if((c>='A' && c<='Z') || (c>='a'&&c<='z')) {
              searchLetter = false;
              m = j;
              continue;
            }
          }
          else {
            if(c>='a' && c<='z') continue;
            nhz += ';';
            pys.splice(t, 0, hz.substr(m, j-m).toLowerCase());
            ++t;
            if(c>='A' && c<='Z') {
              m = j;
              continue;
            }
            searchLetter = true;
          }
          if(nhz.indexOf(c) < 0) {
            var a = this.idx[c];
            if(a)
              a.push(x, t);
            else
              this.idx[c] = [x, t];
          }
          nhz += c;
          ++t;
        }
        if(!searchLetter) {
          nhz += ';';
          pys.splice(t, 0, hz.substr(m).toLowerCase());
          ++t;
        }
        var handledIdx={};
        for(j=0; j<t; ++j) {
          if(!pys[j])
          	continue;
			pys[j] = pys[j].split(',');
          var b = pys[j];
          var bn = b.length, bi;
          for(bi=0; bi<bn; ++bi) {
            var c = b[bi].charAt(0);
            var sc = simpy[c];
            if(sc) c = sc;
            if(handledIdx[c]) continue;
            var a = this.pyidx[c];
            if(a)
              a.push(x, j);
            else
              this.pyidx[c] = [x, j];
            handledIdx[c] = true;
          }
        }
        pys.unshift(nhz);
        this.names.push(pys);
      }
    },

    input: function(s) {
      var i, n=s.length;
      for(i=0; i<n; ++i) {
        var c = s.charAt(i);
        if(c==';') continue;
        var j = this.stkp;
        this.stkp = j+1;
        if(j>=this.instr.length || c != this.instr.charAt(j)) {
          if(c>='A' && c<='Z') c = c.toLowerCase();
          this.instr = this.instr.substr(0, j) + c;
          input_c.apply(this);
        }
      }
    },

    back: function(n) {
      var k = this.stkp;
      if(n<=k)
        this.stkp = k - n;
    },
    
    clear: function() { this.stkp = 0; },
    
    match: function(s) {
      this.clear();
      this.input(s);
      return this.get_match();
    },
    
    get_input: function() {
      return this.instr.substr(0,this.stkp);
    },
    
    get_match: function() {
      var k = this.stkp;
      if(k<=0) return [];
      var a = this.stack[k-1];
      var n = a.length, b=[];
      for(var i=0; i<n; ++i) {
        var ai = a[i], x = ai[0], e = this.names[x][0].length;
        // 第一个字母匹配的位置加权系数1.0, 出现的越早越好
        b.push([this.rnames[x], (ai[3] + (e - ai[1] + 1)/e)/e]);
      }
      b.sort(function(x,y){return y[1]-x[1];});
      return b;
    }
  };

  return constructor;
}());
