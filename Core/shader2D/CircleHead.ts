//顶点着色器   直接使用的是laya官方自带的
var vs: string = `
    attribute vec4 posuv;
    attribute vec4 attribColor;
    attribute vec4 attribFlags;
    attribute vec4 clipDir;
    attribute vec2 clipRect;
    uniform vec4 clipMatDir;
    uniform vec2 clipMatPos;
    varying vec2 cliped;
    uniform vec2 size;
    uniform vec2 clipOff;
    #ifdef WORLDMAT
        uniform mat4 mmat;
    #endif
    #ifdef MVP3D
        uniform mat4 u_MvpMatrix;
    #endif
    varying vec4 v_texcoordAlpha;
    varying vec4 v_color;
    varying float v_useTex;
    
    void main() {
        vec4 pos = vec4(posuv.xy,0.,1.);
        #ifdef WORLDMAT
            pos=mmat*pos;
        #endif
        vec4 pos1  =vec4((pos.x/size.x-0.5)*2.0,(0.5-pos.y/size.y)*2.0,0.,1.0);
        #ifdef MVP3D
            gl_Position=u_MvpMatrix*pos1;
        #else
            gl_Position=pos1;
        #endif
        v_texcoordAlpha.xy = posuv.zw;
        v_texcoordAlpha.z = attribColor.a/255.0;
        v_color = attribColor/255.0;
        v_color.xyz*=v_color.w;
        v_useTex = attribFlags.r/255.0;

        float clipw = length(clipMatDir.xy);
        float cliph = length(clipMatDir.zw);
        vec2 clpos = clipMatPos.xy;
        #ifdef WORLDMAT
        if(clipOff[0]>0.0){
            clpos.x+=mmat[3].x;
            clpos.y+=mmat[3].y;
        }
        #endif
        vec2 clippos = pos.xy - clpos;

        if(clipw>20000. && cliph>20000.)
            cliped = vec2(0.5,0.5);
        else {
            cliped=vec2( dot(clippos,clipMatDir.xy)/clipw/clipw, dot(clippos,clipMatDir.zw)/cliph/cliph);
        }
    }
`
//片元着色器
var ps: string = `
    precision mediump float;

    const float PI = 3.14;
    const float ANGLE45 = -PI / 2.0;

    varying vec2 v_texcoord;
    varying vec4 v_color;
    uniform sampler2D texture;

    varying vec4 v_texcoordAlpha;
    varying vec2 cliped;

    void main(){
        if(cliped.x<0.) discard;
        if(cliped.x>1.) discard;
        if(cliped.y<0.) discard;
        if(cliped.y>1.) discard;

        vec4 col = texture2D(texture, v_texcoordAlpha.xy);

        float x = v_texcoordAlpha.x - 0.5;
        float y = v_texcoordAlpha.y - 0.5;
        float dis = x * x + y * y;
        if(step(dis, 0.25) < 1.){
            discard;
        }

        gl_FragColor = col;
    }
`;

/**
 * 技能cd显示
 */
export default class CircleHead extends Laya.Sprite {
    private shaderValue: Laya.Value2D;
    //定义一个shaderid  用于laya在查找shader 时使用   
    static SHADER_CIRCLE_HEAD: number = 9999;

    constructor() {
        super();
        this.init();
    }

    public init(): void {
        this.shaderValue = new Laya.Value2D(CircleHead.SHADER_CIRCLE_HEAD, CircleHead.SHADER_CIRCLE_HEAD);
        this.shaderValue.shader = new Laya.Shader2X(vs, ps, CircleHead.SHADER_CIRCLE_HEAD);
    }

    set texture(value: any) {
        super.texture = value;
        if (typeof (value) != 'string') {
            this['_renderType'] = Laya.SpriteConst.CUSTOM;
        }
    }

    // 自定义渲染提交
    public customRender(context: Laya.Context, x: number, y: number) {
        //这一步很重要
        let tex:Laya.Texture = this['_texture'];
        if (tex) {
            let w = this.width ? this.width : tex.width;
            let h = this.height ? this.height : tex.height;
            context.drawTarget(tex as any, x, y, w, h, null, this.shaderValue);
        }
    }
}