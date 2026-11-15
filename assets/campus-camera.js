/* Pure camera math; coordinates remain in the map's native vector space. */
window.CampusCamera = Object.freeze({
 fit(bounds, width, height) {
  const ratio=Math.max(1,width)/Math.max(1,height),w=Math.max(bounds[2],bounds[3]*ratio),h=w/ratio;
  return [bounds[0]+bounds[2]/2-w/2,bounds[1]+bounds[3]/2-h/2,w,h];
 },
 zoom(view, factor, point, minWidth, maxWidth) {
  const width=Math.min(maxWidth,Math.max(minWidth,view[2]/factor)),height=view[3]*width/view[2];
  return [view[0]+point[0]*view[2]-point[0]*width,view[1]+point[1]*view[3]-point[1]*height,width,height];
 },
 pan(view, dx, dy, width, height) {return [view[0]-dx*view[2]/width,view[1]-dy*view[3]/height,view[2],view[3]];},
 pinch(view, startDistance, distance, anchor, midpoint, minWidth, maxWidth) {
  const width=Math.min(maxWidth,Math.max(minWidth,view[2]*startDistance/Math.max(1,distance))),height=view[3]*width/view[2];
  return [anchor[0]-midpoint[0]*width,anchor[1]-midpoint[1]*height,width,height];
 }
});
