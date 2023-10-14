"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[814],{6593:(e,t,a)=>{a.d(t,{Zo:()=>d,kt:()=>g});var n=a(1644);function r(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function l(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function i(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?l(Object(a),!0).forEach((function(t){r(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):l(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function o(e,t){if(null==e)return{};var a,n,r=function(e,t){if(null==e)return{};var a,n,r={},l=Object.keys(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||(r[a]=e[a]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(n=0;n<l.length;n++)a=l[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(r[a]=e[a])}return r}var u=n.createContext({}),s=function(e){var t=n.useContext(u),a=t;return e&&(a="function"==typeof e?e(t):i(i({},t),e)),a},d=function(e){var t=s(e.components);return n.createElement(u.Provider,{value:t},e.children)},p="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},c=n.forwardRef((function(e,t){var a=e.components,r=e.mdxType,l=e.originalType,u=e.parentName,d=o(e,["components","mdxType","originalType","parentName"]),p=s(a),c=r,g=p["".concat(u,".").concat(c)]||p[c]||m[c]||l;return a?n.createElement(g,i(i({ref:t},d),{},{components:a})):n.createElement(g,i({ref:t},d))}));function g(e,t){var a=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=a.length,i=new Array(l);i[0]=c;var o={};for(var u in t)hasOwnProperty.call(t,u)&&(o[u]=t[u]);o.originalType=e,o[p]="string"==typeof e?e:r,i[1]=o;for(var s=2;s<l;s++)i[s]=a[s];return n.createElement.apply(null,i)}return n.createElement.apply(null,a)}c.displayName="MDXCreateElement"},7026:(e,t,a)=>{a.d(t,{Z:()=>i});var n=a(1644),r=a(156);const l={tabItem:"tabItem_hFhF"};function i(e){let{children:t,hidden:a,className:i}=e;return n.createElement("div",{role:"tabpanel",className:(0,r.Z)(l.tabItem,i),hidden:a},t)}},6663:(e,t,a)=>{a.d(t,{Z:()=>v});var n=a(373),r=a(1644),l=a(156),i=a(1476),o=a(2824),u=a(9643),s=a(7190),d=a(6985);function p(e){return function(e){return r.Children.map(e,(e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:t}=e;return!!t&&"object"==typeof t&&"value"in t}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}(e).map((e=>{let{props:{value:t,label:a,attributes:n,default:r}}=e;return{value:t,label:a,attributes:n,default:r}}))}function m(e){const{values:t,children:a}=e;return(0,r.useMemo)((()=>{const e=t??p(a);return function(e){const t=(0,s.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,a])}function c(e){let{value:t,tabValues:a}=e;return a.some((e=>e.value===t))}function g(e){let{queryString:t=!1,groupId:a}=e;const n=(0,o.k6)(),l=function(e){let{queryString:t=!1,groupId:a}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!a)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return a??null}({queryString:t,groupId:a});return[(0,u._X)(l),(0,r.useCallback)((e=>{if(!l)return;const t=new URLSearchParams(n.location.search);t.set(l,e),n.replace({...n.location,search:t.toString()})}),[l,n])]}function h(e){const{defaultValue:t,queryString:a=!1,groupId:n}=e,l=m(e),[i,o]=(0,r.useState)((()=>function(e){let{defaultValue:t,tabValues:a}=e;if(0===a.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!c({value:t,tabValues:a}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${a.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const n=a.find((e=>e.default))??a[0];if(!n)throw new Error("Unexpected error: 0 tabValues");return n.value}({defaultValue:t,tabValues:l}))),[u,s]=g({queryString:a,groupId:n}),[p,h]=function(e){let{groupId:t}=e;const a=function(e){return e?`docusaurus.tab.${e}`:null}(t),[n,l]=(0,d.Nk)(a);return[n,(0,r.useCallback)((e=>{a&&l.set(e)}),[a,l])]}({groupId:n}),f=(()=>{const e=u??p;return c({value:e,tabValues:l})?e:null})();(0,r.useLayoutEffect)((()=>{f&&o(f)}),[f]);return{selectedValue:i,selectValue:(0,r.useCallback)((e=>{if(!c({value:e,tabValues:l}))throw new Error(`Can't select invalid tab value=${e}`);o(e),s(e),h(e)}),[s,h,l]),tabValues:l}}var f=a(8810);const k={tabList:"tabList_A6Ol",tabItem:"tabItem_djxK"};function b(e){let{className:t,block:a,selectedValue:o,selectValue:u,tabValues:s}=e;const d=[],{blockElementScrollPositionUntilNextRender:p}=(0,i.o5)(),m=e=>{const t=e.currentTarget,a=d.indexOf(t),n=s[a].value;n!==o&&(p(t),u(n))},c=e=>{let t=null;switch(e.key){case"Enter":m(e);break;case"ArrowRight":{const a=d.indexOf(e.currentTarget)+1;t=d[a]??d[0];break}case"ArrowLeft":{const a=d.indexOf(e.currentTarget)-1;t=d[a]??d[d.length-1];break}}t?.focus()};return r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,l.Z)("tabs",{"tabs--block":a},t)},s.map((e=>{let{value:t,label:a,attributes:i}=e;return r.createElement("li",(0,n.Z)({role:"tab",tabIndex:o===t?0:-1,"aria-selected":o===t,key:t,ref:e=>d.push(e),onKeyDown:c,onClick:m},i,{className:(0,l.Z)("tabs__item",k.tabItem,i?.className,{"tabs__item--active":o===t})}),a??t)})))}function N(e){let{lazy:t,children:a,selectedValue:n}=e;const l=(Array.isArray(a)?a:[a]).filter(Boolean);if(t){const e=l.find((e=>e.props.value===n));return e?(0,r.cloneElement)(e,{className:"margin-top--md"}):null}return r.createElement("div",{className:"margin-top--md"},l.map(((e,t)=>(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==n}))))}function y(e){const t=h(e);return r.createElement("div",{className:(0,l.Z)("tabs-container",k.tabList)},r.createElement(b,(0,n.Z)({},e,t)),r.createElement(N,(0,n.Z)({},e,t)))}function v(e){const t=(0,f.Z)();return r.createElement(y,(0,n.Z)({key:String(t)},e))}},885:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>d,contentTitle:()=>u,default:()=>g,frontMatter:()=>o,metadata:()=>s,toc:()=>p});var n=a(373),r=(a(1644),a(6593)),l=a(6663),i=a(7026);const o={id:"image",title:"Image Node",sidebar_label:"Image"},u=void 0,s={unversionedId:"node-reference/image",id:"node-reference/image",title:"Image Node",description:"Image Node Screenshot",source:"@site/docs/node-reference/image.mdx",sourceDirName:"node-reference",slug:"/node-reference/image",permalink:"/docs/node-reference/image",draft:!1,editUrl:"https://github.com/ironclad/rivet/tree/main/packages/docs/docs/node-reference/image.mdx",tags:[],version:"current",frontMatter:{id:"image",title:"Image Node",sidebar_label:"Image"},sidebar:"nodeReference",previous:{title:"Hash",permalink:"/docs/node-reference/hash"},next:{title:"Abort Graph",permalink:"/docs/node-reference/abort-graph"}},d={},p=[{value:"Overview",id:"overview",level:2},{value:"Inputs",id:"inputs",level:2},{value:"Outputs",id:"outputs",level:2},{value:"Editor Settings",id:"editor-settings",level:2},{value:"Example 1: Create a static image",id:"example-1-create-a-static-image",level:2},{value:"Error Handling",id:"error-handling",level:2},{value:"FAQ",id:"faq",level:2},{value:"See Also",id:"see-also",level:2}],m={toc:p},c="wrapper";function g(e){let{components:t,...o}=e;return(0,r.kt)(c,(0,n.Z)({},m,o,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"Image Node Screenshot",src:a(2366).Z,width:"327",height:"288"})),(0,r.kt)("h2",{id:"overview"},"Overview"),(0,r.kt)("p",null,"The Image Node is used to define a static image for use with other nodes. It can convert a binary type into an image type. The node requires a media type (PNG, JPEG, or GIF) and a data input."),(0,r.kt)("p",null,"The data input can be provided in two ways:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Directly in the node's editor settings, using the image browser."),(0,r.kt)("li",{parentName:"ul"},"Dynamically, by connecting another node to the Image Node's ",(0,r.kt)("inlineCode",{parentName:"li"},"Data")," input port.")),(0,r.kt)("p",null,"The media type can also be provided in two ways:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Directly in the node's editor settings, using the dropdown menu."),(0,r.kt)("li",{parentName:"ul"},"Dynamically, by connecting another node to the Image Node's ",(0,r.kt)("inlineCode",{parentName:"li"},"Media Type")," input port.")),(0,r.kt)(l.Z,{defaultValue:"inputs",values:[{label:"Inputs",value:"inputs"},{label:"Outputs",value:"outputs"},{label:"Editor Settings",value:"settings"}],mdxType:"Tabs"},(0,r.kt)(i.Z,{value:"inputs",mdxType:"TabItem"},(0,r.kt)("h2",{id:"inputs"},"Inputs"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Title"),(0,r.kt)("th",{parentName:"tr",align:null},"Data Type"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"),(0,r.kt)("th",{parentName:"tr",align:null},"Default Value"),(0,r.kt)("th",{parentName:"tr",align:null},"Notes"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Data"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"string")),(0,r.kt)("td",{parentName:"tr",align:null},"The data to be converted into an image."),(0,r.kt)("td",{parentName:"tr",align:null},"(required if if the input toggle for Data is enabled)"),(0,r.kt)("td",{parentName:"tr",align:null},"The input will be coerced into a string if it is not a string.")),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Media Type"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"string")),(0,r.kt)("td",{parentName:"tr",align:null},"The media type of the image (PNG, JPEG, or GIF)."),(0,r.kt)("td",{parentName:"tr",align:null},"(required if if the input toggle for Media Type is enabled)"),(0,r.kt)("td",{parentName:"tr",align:null},"The input will be coerced into a string if it is not a string. The value must be one of the following: ",(0,r.kt)("inlineCode",{parentName:"td"},"image/png"),", ",(0,r.kt)("inlineCode",{parentName:"td"},"image/jpeg"),", or ",(0,r.kt)("inlineCode",{parentName:"td"},"image/gif"),"."))))),(0,r.kt)(i.Z,{value:"outputs",mdxType:"TabItem"},(0,r.kt)("h2",{id:"outputs"},"Outputs"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Title"),(0,r.kt)("th",{parentName:"tr",align:null},"Data Type"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"),(0,r.kt)("th",{parentName:"tr",align:null},"Notes"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Image"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"image")),(0,r.kt)("td",{parentName:"tr",align:null},"The image that was created."),(0,r.kt)("td",{parentName:"tr",align:null},"None"))))),(0,r.kt)(i.Z,{value:"settings",mdxType:"TabItem"},(0,r.kt)("h2",{id:"editor-settings"},"Editor Settings"),(0,r.kt)("table",null,(0,r.kt)("thead",{parentName:"table"},(0,r.kt)("tr",{parentName:"thead"},(0,r.kt)("th",{parentName:"tr",align:null},"Setting"),(0,r.kt)("th",{parentName:"tr",align:null},"Description"),(0,r.kt)("th",{parentName:"tr",align:null},"Default Value"),(0,r.kt)("th",{parentName:"tr",align:null},"Use Input Toggle"),(0,r.kt)("th",{parentName:"tr",align:null},"Input Data Type"))),(0,r.kt)("tbody",{parentName:"table"},(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Media Type"),(0,r.kt)("td",{parentName:"tr",align:null},"The media type of the image (PNG, JPEG, or GIF)."),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"image/png")),(0,r.kt)("td",{parentName:"tr",align:null},"Yes"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"string"))),(0,r.kt)("tr",{parentName:"tbody"},(0,r.kt)("td",{parentName:"tr",align:null},"Image"),(0,r.kt)("td",{parentName:"tr",align:null},"The data to be converted into an image."),(0,r.kt)("td",{parentName:"tr",align:null},"(empty)"),(0,r.kt)("td",{parentName:"tr",align:null},"Yes"),(0,r.kt)("td",{parentName:"tr",align:null},(0,r.kt)("inlineCode",{parentName:"td"},"string"))))))),(0,r.kt)("h2",{id:"example-1-create-a-static-image"},"Example 1: Create a static image"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"Create an Image Node."),(0,r.kt)("li",{parentName:"ol"},"In the node's editor settings, click on the ",(0,r.kt)("inlineCode",{parentName:"li"},"Pick Image")," button. This will open the image browser."),(0,r.kt)("li",{parentName:"ol"},"Select an image from the image browser. The selected image will be displayed in the ",(0,r.kt)("inlineCode",{parentName:"li"},"Image")," field."),(0,r.kt)("li",{parentName:"ol"},"Run the graph. The ",(0,r.kt)("inlineCode",{parentName:"li"},"Image")," output of the Image Node should contain the selected image.")),(0,r.kt)("p",null,(0,r.kt)("img",{alt:"Image Node Example 1",src:a(9474).Z,width:"304",height:"642"})),(0,r.kt)("h2",{id:"error-handling"},"Error Handling"),(0,r.kt)("p",null,"The Image Node will error if the ",(0,r.kt)("inlineCode",{parentName:"p"},"Data")," input or the ",(0,r.kt)("inlineCode",{parentName:"p"},"Media Type")," input is not provided. It will also error if the ",(0,r.kt)("inlineCode",{parentName:"p"},"Data")," input cannot be converted into an image."),(0,r.kt)("h2",{id:"faq"},"FAQ"),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: Can I use the Image Node to display an image in the Rivet UI?")),(0,r.kt)("p",null,"A: Yes, the Image Node can be used to display an image in the Rivet UI. The image will be displayed in the node's output port when the graph is run."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: Can I use the Image Node to convert a binary type into an image?")),(0,r.kt)("p",null,"A: Yes, you can use the Image Node to convert a binary type into an image. You will need to provide the binary data to the ",(0,r.kt)("inlineCode",{parentName:"p"},"Data")," input of the Image Node and set the ",(0,r.kt)("inlineCode",{parentName:"p"},"Media Type")," to the appropriate type for the image."),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Q: What image formats are supported by the Image Node?")),(0,r.kt)("p",null,"A: The Image Node supports PNG, JPEG, and GIF formats."),(0,r.kt)("h2",{id:"see-also"},"See Also"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/text"},"Text Node")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/node-reference/audio"},"Audio Node")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/docs/user-guide/data-types"},"Data Types"))))}g.isMDXComponent=!0},9474:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/image-node-example-01-d1bfc83b56ec20a8366196466c758be7.png"},2366:(e,t,a)=>{a.d(t,{Z:()=>n});const n=a.p+"assets/images/image-node-da03e68a3621b7ef87836b8bf5b22144.png"}}]);