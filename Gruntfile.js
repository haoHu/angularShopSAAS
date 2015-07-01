// Build Project 
'use strict';
module.exports = function (grunt) {
	var fs = require('fs'),
		path = require('path');
	require('time-grunt')(grunt);
	// 加载所有grunt插件
	require('load-grunt-tasks')(grunt);
	// 配置参数
	var banner = "Hualala SAAS FE Project";
	var config = {
		src : "app",
		dist : "dist",
		test : "test",
		zipFileName : "",
		pkg : grunt.file.readJSON("package.json"),
		connect : {
			port : 9000,
			hostname : '*'
		},
		banner : '/*!' + banner + '\n' +
			'* <%= config.pkg.name %> -v <%= config.pkg.version %>-\n' + 
			'<%= config.pkg.homepage ? "* " + config.pkg.homepage + "\\n" : "" %>' + 
			'* Copyright (c) <%= grunt.template.today("yyyy")%> <%= config.pkg.author.name %> (<%= config.pkg.author.homepage %>) */\n'
	};

	// 定义所有任务
	grunt.initConfig({
		config : config,
		// 清空临时文件
		clean : {
			server : '.tmp',
			dist : {
				files : [{
					dot : true,
					src : [
						'.tmp',
						'<%= config.dist %>/*',
						'<%= config.dist %>/.git'
					]
				}]
			},
			disttest : ['<%= config.dist %>/css/*.less', '<%= config.dist %>/test'],
			zip : './*.tar.gz'
		},
		// JS语法校验
		jshint : {
			options : {
				jshintrc : '.jshintrc',
				globals : {
					jQuery : true,
					console : true,
					module : true,
					document : true,
					IX : true
				},
				reporter : require('jshint-stylish')
			},
			all : [
				'Gruntfile.js',
				'<%= config.src %>/js/{,*/}*.js',
				'<%= config.test %>/{.*/}*.js'
			]
		},
		// 监听文件变化
		watch : {
			bower : {
				files : ['bower.json'],
				tasks : ['wiredep']
			},
			js : {
				files : ['<%= config.src %>/js/{,*/}*.js'],
				tasks : ['jshint'],
				options : {
					livereload : true
				}
			},
			jstest : {
				files : ['test/{,*/}*.js'],
				tasks : ['test:watch']
			},
			gruntfile : {
				files : ['Gruntfile.js']
			},
			less : {
				files : ['<%= config.src %>/css/{,*/}*.less'],
				tasks : ['less']
			},
			css : {
				files : ['<%= config.src %>/css/{,*/}*.css'],
				tasks : ['newer:copy:css']
			},
			html : {
				files : ['<%= config.src %>/{,*/}*.html']
			},
			livereload : {
				options : {
					livereload : '<%= connect.options.livereload %>'
				},
				files : [
					'<%= config.src %>/{,*/}*.html',
					'.tmp/css/{,*/}*.*',
					'<%= config.src %>/img/{,*/}*'
				]
			}
		},
		// 依赖自动拷贝到指定目录位置
		bower : {
			install : {
				options : {
					targetDir : '<%= config.src %>/js/vendor',
					layout : 'byComponent',
					install : true,
					verbose : false,
					cleanTargetDir : false,
					cleanBowerDir : false,
					bowerOptions : {
						forceLatest : true,
						production : false
					}
				}
			}
		},
		// build性能加速
		concurrent : {
			server : [
				'less',
				'copy:css'
			],
			test : [
				'less',
				'copy:css'
			],
			dist : [
				'less',
				'copy:css',
				'copy:dist'
			]
		},
		// web 服务器
		connect : {
			options : {
				port : '<%= config.connect.port %>',
				open : true,
				livereload : 35729,
				hostname : '<%= config.connect.hostname %>'
			},
			livereload : {
				options : {
					middleware : function (connect) {
						return [
							connect.static('.tmp'),
							connect().use('/bower_components', connect.static('./bower_components')),
							connect().use('/test', connect.static('./test')),
							// connect().use('/test', connect.static('./app/test')),
							connect.static(config.src)
						]
					}
				}
			},
			test : {
				options : {
					open : false,
					port : 9001,
					middleware : function (connect) {
						return [
							connect.static('.tmp'),
							connect.static('.test'),
							connect().use('/bower_components', connect.static('./bower_components')),
							connect.static(config.src)
						];
					}
				}
			},
			dist : {
				options : {
					// base : '<%= config.dist %>',
					// livereload : false
					middleware : function (connect) {
						return [
							connect.static('<%= config.dist %>'),
							connect().use('/bower_components', connect.static('./bower_components')),
							connect().use('/test', connect.static('./test')),
							connect.static(config.dist)
						]
					}
				}
			}
		},
		// 编译Less文件
		less : {
			options : {
				report : 'min'
			},
			compile : {
				files : {
					"<%= config.src %>/css/core.css" : "<%= config.src %>/css/core.less"
				}
			}
		},
		// 压缩css文件
		cssmin : {
			options : {
				report : "gzip",
				banner : "/*Hualala SASS Layout File*/"
			},
			minify : {
				expand : true,
				cwd : "<%= config.dist %>",
				src : ["css/*.css", "js/vendor/{,*/}*.css"],
				dest : "<%= config.dist %>"
			}
		},
		// 拷贝文件
		copy : {
			css : {
				expand : true,
				dot : true,
				cwd : '<%= config.src %>/css',
				dest : '.tmp/css',
				src : '{,*/}*.css'
			},
			dist : {
				expand : true,
				dot : true,
				cwd : '<%= config.src %>',
				dest : '<%= config.dist %>',
				src : [
					'{,*/}*.html',
					'css/*.css'
				]
			}
		},
		// 指定不同发布环境页面的设置
		targethtml : {
			dev : {
				files : {
					'.tmp/index.html' : '<%= config.src %>/index.html'
				}
			},
			mu : {
				files : {
					'<%= config.dist %>/index.html' : '<%= config.src %>/index.html'
				}
			},
			dohko : {
				files : {
					'<%= config.dist %>/index.html' : '<%= config.src %>/index.html'
				}
			},
			dist : {
				files : {
					'<%= config.dist %>/index.html' : '<%= config.src %>/index.html'
				}
			}
		},
		requirejs : {
			compile : {
				options : {
					appDir : "<%= config.src %>/",
					baseUrl : "./js",
					mainConfigFile : "<%= config.src %>/js/main.js",
					dir : "<%= config.dist %>",
					modules : [
						{
							name : "main"
							// include : ["jquery", "underscore", 'IX', 'commonFn', 'datatype', 'global-const', 'matcher', 'uuid']
						},
						{
							name : "signin/SigninViewController",
							include : ["services/appServices", "directives/appDirectives"],
							exclude : ["main"]
						},
						{
							name : "signup/SignupViewController",
							include : ["services/appServices", "directives/appDirectives"],
							exclude : ["main"]
						},
						{
							name : "profile/moreViewController",
							include : ['services/appServices', 'directives/appDirectives', 'filters/appFilters'],
							exclude : ["main"]
						},
						{
							name : 'profile/soldoutViewController',
							include : ['services/appServices', 'directives/appDirectives', 'filters/appFilters', 'services/orderServices', 'services/foodMenuServices'],
							exclude : ["main"]
						},
						{
							name : 'baobiao/BaoBiaoViewController',
							include : ['services/appServices', 'directives/appDirectives', 'services/statisticsServices', 'filters/appFilters'],
							exclude : ["main"]
						},
						{
							name : 'huiyuan/HuiYuanViewController',
							include : ['directives/appDirectives', 'services/appServices', 'filters/appFilters'],
							exclude : ["main"]
						},
						{
							name : 'dingdan/DingDanViewController',
							include : ['directives/appDirectives', 'services/appServices', 'services/orderServices', 'filters/appFilters'],
							exclude : ["main"]
						},
						{
							name : 'diandan/DinnerViewController',
							include : ['directives/appDirectives', 'services/appServices', 'services/orderServices', 'services/foodMenuServices', 'filters/appFilters'],
							exclude : ["main"]
						},
						{
							name : 'diandan/TableViewController',
							include : ['directives/appDirectives', 'services/appServices', 'services/orderServices', 'services/tableServices', 'filters/appFilters'],
							exclude : ["main"]
						},
						{
							name : 'jiedan/JieDanViewController',
							include : ['directives/appDirectives','services/appServices','services/orderServices','services/tableServices','filters/appFilters'],
							exclude : ["main"]
						},
						{
							name : 'home/HomeViewController',
							include : ['services/appServices'],
							exclude : ["main"]
						}
					]
				}
			}
		},
		karma : {
			unit : {
				configFile : 'karma.conf.js',
				singleRun : true
			}
		}
		
	});
	// 本地调试任务
	grunt.registerTask('serve', 'Start the server and preview your app, --allow-remote for remote access', function (target) {
		if (grunt.option('allow-remote')) {
			grunt.config.set('connect.options.hostname', '0.0.0.0');
		}
		if (target === 'dist' || target === 'mu' || target === 'dohko') {
			return grunt.task.run(['build:' + target, 'connect:dist:keepalive']);
		}
		grunt.task.run([
					'clean:server',
					'bower',
					'concurrent:server',
					'targethtml:dev',
					'connect:livereload',
					'watch'
				]);
	});
	// 发布任务
	grunt.registerTask('build', function (target) {
		var htmlTarget = !target ? 'dev' : target;
		grunt.task.run([
			'clean:dist',
			'bower',
			'concurrent:dist',
			'requirejs',
			'clean:disttest',
			'targethtml:' + htmlTarget,
			'cssmin'
		]);
		if (htmlTarget == 'mu' || htmlTarget == 'dohko' || htmlTarget == 'dist') {
			grunt.task.run([
				'clean:zip',
				'genSVNRevision:' + htmlTarget,
				'genRevision',
				'zip'
			]);
		}
	});

	// 单元测试
	grunt.registerTask('test', function () {
		grunt.task.run([
				'clean:server',
				'less',
				'bower',
				'concurrent:test',
				'connect:test',
				'karma'
			]);
	});

	// 生成打包文件所需版本号
	grunt.registerTask('genSVNRevision', "Generate SVN Revision to zip file name", function (target) {
		var done = this.async(),
			exec = require('child_process').exec,
			child;
		child = exec("svn info|grep Revision |sed 's/.* //'", {
			cwd : './'
		}, function (error, stdout, stderr) {
			if (error !== null) {
				grunt.log.error('exec error: ' + error);
				done(false);
				return;
			}
			grunt.log.ok("The SVN Revision hasbeen generated!");
			var date = new Date(),
				y = date.getFullYear(),
				m = date.getMonth() + 1,
				d = date.getDate(),
				revision = parseInt(stdout);
			m = m > 9 ? m : ('0' + m);
			d = d > 9 ? d : ('0' + d);
			grunt.log.ok(stdout);
			grunt.log.ok(revision);
			config.zipFileName = target + '.SAAS-FE.' + y + m + d + '_' + revision + '.tar.gz';
			grunt.log.ok("The zip file name is " + config.zipFileName);
			done(true);
		});
	});

	// 生成打包文件版本说明文件
	grunt.registerTask('genRevision', "Generate revision file", function () {
		var done = this.async(),
			fileName = config.zipFileName,
			revisionFile = './revision';
		var revisionValue = fileName.split('.')[2];
		fs.exists(revisionFile, function (exists) {
			if (exists) {
				fs.unlinkSync(revisionFile);
			}
			fs.open(revisionFile, 'w+', function (err, fd) {
				if (err) {throw err;}
				var buffer = new Buffer(revisionValue),
					bufferLength = buffer.length, filePosition = null;
				fs.write(fd, buffer, 0, bufferLength, filePosition, function (err, written) {
					if (err) {throw err;}
					grunt.log.ok('wrote ' + written + ' bytes');
					fs.close(fd, function (err) {
						if (err) {throw err;}
					});
					done(true);
				});
			});
		});
	});

	// 打包压缩前段工程文件
	grunt.registerTask('zip', "Zip builded files to dist.tar.gz", function () {
		var done = this.async(),
			exec = require('child_process').exec,
			child;
		var fileName = config.zipFileName,
			cmd = 'tar -zcvf ' + fileName + ' ./dist ./revision';
		grunt.log.ok("The zip file name is " + fileName);
		child = exec(cmd, {
			cwd : './'
		}, function (error, stdout, stderr) {
			if (error !== null) {
				grunt.log.error('exec error:' + error);
				done(false);
				return ;
			}
			grunt.log.ok("The project has been ziped!");
			grunt.log.ok(stdout);
			done(true);
		});
	});
};