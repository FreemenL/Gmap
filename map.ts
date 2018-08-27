/**
 * [ 高德地图工具类 ]
 * @Author   freemenL
 * @DateTime 2018-08-14T18:54:32+0800
 */
import ReactDOM from "react-dom";
interface Options{

}

class Gmap{

	public historyMarker
	public polygonEditor
	public GmapObj:any;
	public mouseTool:{polygon?:any,on?:(type:string,Func:(options:any)=>void)=>void}
	/**
	 * [constructor description]
	 * @param {React.ReactNode} public mapContainer [地图容器]
	 * @param {object}          public options      [配置参数对象]
	*/
	constructor(public mapContainer:React.ReactNode,public options?:Options){

		this.mouseTool = Object.prototype;
		this.init();//初始化 
		this.addPlugin();//添加插件

	}
	
	protected init(){

		this.GmapObj = new AMap.Map(this.mapContainer, {
	      resizeEnable: true,
	      pitch:30,
	      zoom:16,
	      center: [116.397428, 39.90923],
	      ...this.options
	  });

	}
	//添加插件
	protected addPlugin(){

		this.GmapObj.plugin(["AMap.ToolBar"], ()=> {
			this.GmapObj.addControl(new AMap.ToolBar());
		});

		if(location.href.indexOf('&guide=1')!==-1){
			this.GmapObj.setStatus({scrollWheel:false})
		}
		this.mouseTool = new AMap.MouseTool(this.GmapObj);

	}

	//设置城市中心点
	public setCity({cityName}:{cityName?:string}){

      if (!cityName) {
          cityName = '北京市';
      }
      this.GmapObj.setCity(cityName);

	}
	//事件监听
	public addPolygonEvent(polygonNode){

		AMap.event.addDomListener(polygonNode, 'click',(event)=> {
	  	const options:any={};
      let drawPolygon = this.mouseTool.polygon(options);
    }, false);

	}
	//订阅mouseTool 事件
	public subscription(callback:(params:Array<string>)=>void){

		this.mouseTool.on&&this.mouseTool.on("draw",({type,obj})=>{
	    callback(obj["F"]['path']);
	  })

	}
	//加载完成
	public loadComplete(callBack){
		this.GmapObj.on('complete',callBack);
	}
	/**
	 * @path [构建多边形经纬度坐标数组]
	*/
	public drawPolygon(path){

    const editor_polygon = new AMap.Polygon({
      map: this.GmapObj,
      path: path,
      strokeColor: "#0000ff",
      strokeOpacity: 1,
      strokeWeight: 3,
      fillColor: "#f5deb3",
      fillOpacity: 0.35
    });	

    this.polygonEditor = new AMap.PolyEditor(this.GmapObj, editor_polygon);

	}
	/**
	 * [添加信息窗体标记]
	 * @param    {Array<any>}
	 */
	public addMarker(position:Array<any>,infoNode) {

		let markerArr = [];

 		position.find((item:any,index:number,array:any):any=>{

	  	const marker = new AMap.Marker({
	      position: new AMap.LngLat(...item),
	      icon:require("../public/car.png")
	    });

	  	const infoWindow = new AMap.InfoWindow({
	        isCustom: true,  //使用自定义窗体
	        content: '<div id="infoContent"></div>',
	        closeWhenClickMap:true,
	        offset: new AMap.Pixel(25, -26)
	    });

	    AMap.event.addListener(marker, 'click', (Event)=> {
	    	/**
	    	 * 获取标记位置移动地图中心点
	    	*/
	    	const positions = new AMap.LngLat(Event.lnglat.lng, Event.lnglat.lat+.3);
	    	this.GmapObj.setCenter(positions); 

	    	infoWindow.open(this.GmapObj, marker.getPosition());
	    	//infoWindow.open 没有相应的回掉 暂时用蹩脚的方式解决
        setTimeout(()=>{
        	ReactDOM.render(infoNode,document.getElementById('infoContent'));
        },100)

      });

	    Array.prototype.push.call(markerArr,marker);

		})

    this.GmapObj.add(markerArr);
  }
  /**
   * 绘制线
   */
  createPolyline(options){

  	const {path,strokeColor,strokeWeight} = options;
  	return new AMap.Polyline({
        map: this.GmapObj,
        path:path?path:[],
        strokeColor,  //线颜色
        // strokeOpacity: 1,     //线透明度
        strokeWeight,      //线宽
        // strokeStyle: "solid"  //线样式
    });

  }
  /**
   * 显示历史轨迹
  */
  showHistoryPath(lineArr:Array<any>){

  	const LngLat = [114.719377,22.82828];
  	this.historyMarker = new AMap.Marker({
        map: this.GmapObj,
        position: LngLat,
        icon: "https://webapi.amap.com/images/car.png",
        offset: new AMap.Pixel(-26, -13),
        autoRotation: true
    });

    let lngX = 114.719377, latY = 22.82828;        
    lineArr.push(new AMap.LngLat(lngX, latY));
    for (let i = 1; i < 4; i++) {
        lngX = lngX + Math.random() * 0.05;
        if (i % 2) {
            latY = latY + Math.random() * 0.0001;
        } else {
            latY = latY + Math.random() * 0.06;
        }
        lineArr.push(new AMap.LngLat(lngX, latY));
    }
   	
    const polyline = this.createPolyline({
    	path: lineArr,
    	strokeColor: "#00A", 
    	strokeWeight: 3
    })

    var passedPolyline =  this.createPolyline({
    	strokeColor: "#F00", 
    	strokeWeight: 3
    })

    this.historyMarker.on('moving',(e)=>{

    		const passPath = e.passedPath[e.passedPath.length-1];
    		const positions = new AMap.LngLat([passPath["lng"]],passPath["lat"]);
  			this.GmapObj.setZoomAndCenter(15,positions); 
        passedPolyline.setPath(e.passedPath);

    })

    this.GmapObj.setFitView();

    this.historyMarker.moveAlong(lineArr, 800);

  }
  /**
  	* 清除窗体信息
  */
  public clearInfoWindow(){
  	this.GmapObj.clearInfoWindow();
  }; 

}

const loadMap = (mapNode:React.ReactNode,options?:Options):Promise<any>=>{
	return new Promise((resolve,reject)=>{
		//实例化地图对象
		const map = new Gmap(mapNode,options);
		//加载完成导入地图
		map.loadComplete(resolve(map));

	}).catch((Err)=>{
		throw new Error("地图加载失败！");
	})
}


export default loadMap;



