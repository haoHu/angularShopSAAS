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
		pkg : grunt.file.readJSON("package.json"),
		connect : {
			port : 9000,
			hostname : 'localhost'
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
			}
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
				'svgmin'
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
					base : '<%= config.dist %>',
					livereload : false
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
		// 拷贝文件
		copy : {
			css : {
				expand : true,
				dot : true,
				cwd : '<%= config.src %>/css',
				dest : '.tmp/css',
				src : '{,*/}*.css'
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
					'<%= config.dist %>/index.html' : '<%= config.dist %>/index.html'
				}
			},
			dohko : {
				files : {
					'<%= config.dist %>/index.html' : '<%= config.dist %>/index.html'
				}
			},
			dist : {
				files : {
					'<%= config.dist %>/index.html' : '<%= config.dist %>/index.html'
				}
			}
		},
		requirejs : {
			compile : {
				options : {}
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
					'targethtml:dev',
					'concurrent:server',
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
			'targethtml:' + htmlTarget,
			'requirejs'
			]);
	});
};