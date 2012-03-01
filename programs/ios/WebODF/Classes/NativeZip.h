#import <PhoneGap/PGPlugin.h>

@interface NativeZip : PGPlugin {
     NSString* callbackID;
}

@property (nonatomic, copy) NSString* callbackID;

- (void) loadAsString:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options;

@end